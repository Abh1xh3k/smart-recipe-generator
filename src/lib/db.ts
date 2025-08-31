// Database utility file to avoid relative path issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbConnect = require('../../lib/mongodb')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Recipe = require('../../models/Recipe')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Rating = require('../../models/Rating')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Favorite = require('../../models/Favorite')

export { dbConnect, Recipe, Rating, Favorite }
