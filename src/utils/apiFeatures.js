class ApiFeatures {
    constructor(mongooseQuery, queryString){
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    /*
     * Filtering
     */
    filter(){
        const queryObject = {...this.queryString};
        const excludesFields = ['page', 'limit', 'sort', 'fields', 'keyword'];
        excludesFields.forEach((field) => delete queryObject[field]);
        //Apply filtration using [gte, gt, lte, lt]
        let queryStr = JSON.stringify(queryObject);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => (`$${match}`));

        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
        return this;
    }

    /*
     * Sorting
     */
    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else{
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt')
        }
        return this;
    }

    /*
     * Fields Limiting
     */
    limitFields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
    }

    /*
     * Search
     */
    search(modelName){
        if(this.queryString.keyword){
            const searchQuery = {};
            if(modelName === 'products'){
                searchQuery.$or = [
                    {title: {$regex: this.queryString.keyword, $options: 'i'} },
                    {description: {$regex: this.queryString.keyword, $options: 'i'}}
                ];
            } else{
                searchQuery.$or = [
                    {name: {$regex: this.queryString.keyword, $options: 'i'} }
                ];
            }

            this.mongooseQuery = this.mongooseQuery.find(searchQuery);
        }
        return this
    }
    
    /*
     * Pagination
     */
    paginate(countDocuments){
        let page = parseInt(this.queryString.page, 10) || 1;
        let limit = parseInt(this.queryString.limit, 10) || 50;
        const skip = (page - 1) * limit;
        const displayedCount = page * limit;
        //Ensure that values are positive and logical
        if(page < 1) page = 1;
        if(limit < 1 || limit > 100) limit = 50;

        //Pagination result
        const pagination = {};
        pagination.currentPage = page;
        pagination.limit = limit;
        pagination.Pages = Math.ceil(countDocuments / limit);
        //next page
        if(displayedCount < countDocuments){
            pagination.nextPage = page + 1;
        }
        //previous page
        if(skip > 0){
            pagination.prevPage = page - 1;
        }

        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

        this.paginationResult = pagination;
        return this;
    }

};


module.exports = ApiFeatures;