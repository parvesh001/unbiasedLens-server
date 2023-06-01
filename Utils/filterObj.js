module.exports = (obj, ...args)=>{
    const filteredObj = {}

    for(let key in obj){
        if(args.includes(key)) filteredObj[key] = obj[key]
    }
    return filteredObj
}