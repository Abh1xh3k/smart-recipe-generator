// Database utility file to avoid relative path issues
import dbConnect from '../../lib/mongodb'
import Recipe from '../../models/Recipe'
import Rating from '../../models/Rating'
import Favorite from '../../models/Favorite'

export { dbConnect, Recipe, Rating, Favorite }
