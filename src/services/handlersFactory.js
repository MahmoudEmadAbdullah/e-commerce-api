const asyncHandler = require('express-async-handler');

const { client } = require('../config/redisConfig');
const { deleteCacheKeys } = require('../utils/cacheUtils');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');


/**
 * @desc      Get specific document by ID
 * @access    public
 */
exports.getDocument = (Model, populateOpt, useCache=false) => 
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const populateKey = populateOpt ? 
        (typeof populateOpt === 'string' ? populateOpt : JSON.stringify(populateOpt).replace(/[{}"]/g, ''))
        : 'no-populate';

        const cacheKey = `doc:${Model.collection.name}:${id}:${populateKey}`;

        // Check Redis cache before fetching from the database  
        if(useCache) {
            try  {
                const cachedData = await client.get(cacheKey);
                if(cachedData) {
                    return res.status(200).json({
                        status: true,
                        source: 'cache',
                        data: JSON.parse(cachedData)
                    });
                }
            } catch(cacheError) {
                console.error('Cache Read Error:', cacheError);
            }
        }

        try {
        //Build query
        let query = Model.findById(id);
        if(populateOpt){
            query = query.populate(populateOpt);
        }
        //Execute query
        const document = await query;
        if(!document){
            return next(new ApiError('No document found', 404));
        }

        res.status(200).json({
            status: true,
            source: 'database',
            data: document
        });

        // Store the result in Redis if `useCache` is true
        if(useCache) {
            const documentToCache = document.toObject() ? document.toObject() : document;
            await client.setEx(cacheKey, 3600, JSON.stringify(documentToCache));
        }
    } catch(dbError) {
        next(dbError);
    }
});



/**
 * @desc      Create a new document
 * @access    private
 */
exports.createDocument = (Model, useCache = false) => 
    asyncHandler(async (req, res, next) => {
        const document = await Model.create(req.body);

        if(useCache){
            setImmediate(async () => {
                try {
                    const listCachePattern = `docs:${Model.collection.name}:*`;
                    await deleteCacheKeys(listCachePattern);
                } catch(cacheError) {
                    console.error('Cache Deletion Error:', cacheError);
                }
            });
        }

        res.status(201).json({data: document});
    });



/**
 * @desc      Update a specific document by ID
 * @access    private
 */
exports.updateDocument = (Model, useCache = false) => 
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndUpdate(
            id,
            req.body,
            {new: true, runValidators: true}
        );
        if(!document){
            return next(new ApiError('No document found', 404));
        }

        if(useCache){
            setImmediate(async () => {
                try {
                    // 1. Delete the cache related to the deleted document
                    const docCachePattern = `doc:${Model.collection.name}:${id}:*`;
                    await deleteCacheKeys(docCachePattern);

                    // 2. Delete the cache related to the document list
                    const listCachePattern = `docs:${Model.collection.name}:*`;
                    await deleteCacheKeys(listCachePattern);
                } catch(cacheError) {
                    console.error('Cache Deletion Error:', cacheError);
                }
            });
        }

        // Trigger "save" event when update document (RviewModel)
        await document.save();
        res.status(200).json({data: document});
    });



/**
 * @desc      Delete a specific document by ID
 * @access    private
 */
exports.deleteDocument = (Model, useCache = false) => 
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findById(id);
        if (!document) {
            return next(new ApiError('No document found', 404));
        }

        // Special logic for UserModel to prevent admin from deleting themselves or last admin
        if(Model.modelName === 'User') {
            if(document.role === 'admin') {
                // Get number of admins in the system
                const adminCount = await Model.countDocuments({ role: 'admin' });
                // Prevent deleting the last admin
                if(adminCount === 1) {
                    return next(new ApiError('Cannot delete the last admin', 400));
                }
                // Prevent admin from deleting themselves
                if(req.user._id.toString() === id.toString()) {
                    return next(new ApiError('Admin cannot delete themselves', 403));
                }
            }
        }

        if(useCache) {
            setImmediate(async () => {
                try {
                    // 1. Delete the cache related to the deleted document
                    const docCachePattern = `doc:${Model.collection.name}:${id}:*`;
                    await deleteCacheKeys(docCachePattern);

                    // 2. Delete the cache related to the document list
                    const listCachePattern = `docs:${Model.collection.name}:*`;
                    await deleteCacheKeys(listCachePattern);

                } catch (cacheError) {
                    console.error('Cache Deletion Error:', cacheError);
                }
            });
        }

        //Trigger "deleteOne" event when deleting document (ReviewModel)
        await document.deleteOne();
        res.status(204).send();
    });


/**
 * @desc      Get a list of documents with filtering, searching, pagination, and sorting
 * @access    public
 */
exports.getAllDocuments = (Model, modelName, useCache = false) => 
    asyncHandler(async (req, res, next) => {
        // Apply filtering conditions from middleware if set
        let filter = {};
        if(req.filterObj) filter = req.filterObj;

        const queryForCache = {...req.query};
        ['page', 'limit', 'sort', 'fields'].forEach((field) => delete queryForCache[field]);
        const cacheKey = `docs:${modelName}:${JSON.stringify(queryForCache)}`;

        if(useCache) {
            try {
                const cachedData = await client.get(cacheKey);
                if(cachedData) {
                    let data = JSON.parse(cachedData);
                    // Sorting
                    const sortBy = req.query.sort ? req.query.sort.split(',').join(' ') : '-createdAt';
                    data = data.sort((a, b) => {
                        const sortFields = sortBy.split(' ');
                        for(const field of sortFields) {
                            const [key, order] = field.startsWith('-') ? [field.slice(1), -1] : [field, 1];
    
                            if(a[key] < b[key]) return -1 * order;
                            if(a[key] > b[key]) return 1 * order;
                        }
                        return 0;
                    });
    
                    // Fields Limiting
                    if(req.query.fields) {
                        const fields = req.query.fields.split(','); 
                        data = data.map(doc => {
                            const filterDoc = {};
                            fields.forEach(field => {
                                if(doc[field] !== undefined) filterDoc[field] = doc[field];
                            });
                            return filterDoc;
                        });
                    } else {
                        data = data.map(({ __v, ...rest }) => rest)
                    }
    
                    // Pagination
                    let page = parseInt(req.query.page, 10) || 1;
                    let limit = parseInt(req.query.limit, 10) || 50;
                    if(page < 1) page = 1;
                    if(limit < 1 || limit > 100) limit = 50;
    
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit;
                    const paginationData = data.slice(startIndex, endIndex);
    
                    // Calc pagination result
                    const totalItems = data.length;
                    const totalPages = Math.ceil(totalItems / limit);
                    const paginationResult = {
                        currentPage: page,
                        limit: limit,
                        pages: totalPages
                    };
                    if(endIndex < totalItems) paginationResult.nextPage = page + 1;
                    if(startIndex > 0) paginationResult.prevPage = page - 1;
    
                    return res.status(200).json({
                        status: true,
                        source: 'cache',
                        result: paginationData.length,
                        paginationResult,
                        data: paginationData
                    });
                }
            } catch(cacheError) {
                console.error('Cache Read Error:', cacheError);
            }
        }

        // First apply filtering and searching (before pagination)
        // This ensures we count the correct number of documents
        const baseApiFeatures = new ApiFeatures(Model.find(filter), req.query)
            .filter()
            .search(modelName);

        //Use the same filter criteria applied in the query to ensure accurate counting
        const documentCounts = await Model.countDocuments(baseApiFeatures.mongooseQuery.getFilter());

        //continue with pagination, sorting, and field limiting
        const apiFeatures = new ApiFeatures(baseApiFeatures.mongooseQuery, req.query)
            .paginate(documentCounts)
            .sort()
            .limitFields();
        
        // Execute the final query
        const { mongooseQuery, paginationResult } = apiFeatures;
        const documents = await mongooseQuery;

        if(!documents || documents.length === 0){
            return next(new ApiError('No documents found', 404));
        }

        if(useCache) {
            try {
                const allDocuments = await baseApiFeatures.mongooseQuery.clone().exec();
                await client.setEx(cacheKey, 3600, JSON.stringify(allDocuments));
            } catch(cacheWriteError) {
                console.error('Cache Write Error:', cacheWriteError);
            }
        }

        res.status(200).json({
            status: true,
            source: 'database',
            result: documents.length, 
            paginationResult, 
            data: documents
        });
    });
