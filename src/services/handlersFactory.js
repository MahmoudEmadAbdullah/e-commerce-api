const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');


/**
 * @desc      Get specific document by ID
 * @access    public
 */
exports.getDocument = (Model) => 
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findById(id);
        if(!document){
            return next(new ApiError('No document found', 404));
        }
        res.status(200).json({data: document});
    });



/**
 * @desc      Create a new document
 * @access    private
 */
exports.createDocument = (Model) => 
    asyncHandler(async (req, res, next) => {
        const document = await Model.create(req.body);
        res.status(201).json({data: document});
    });



/**
 * @desc      Update a specific document by ID
 * @access    private
 */
exports.updateDocument = (Model) => 
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
        res.status(200).json({data: document});
    });



/**
 * @desc      Delete a specific document by ID
 * @access    private
 */
exports.deleteDocument = (Model) => 
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findByIdAndDelete(id);
        if(!document){
            return next(new ApiError('No document found', 404));
        }
        res.status(204).send();
    });
    

    
/**
 * @desc      Get a list of documents with filtering, searching, pagination, and sorting
 * @access    public
 */
exports.getAllDocuments = (Model, modelName) => 
    asyncHandler(async (req, res, next) => {
        // Apply filtering conditions from middleware if set
        let filter = {};
        if(req.filterObj){
            filter = req.filterObj;
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
        res
            .status(200)
            .json({result: documents.length, paginationResult, data: documents});
        
    });
