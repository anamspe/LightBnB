const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { query } = require('express');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT * FROM users
  WHERE email = $1`;

  return pool
    .query(queryString, [email])
    .then((result) => {
      if (!result.rows[0]) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log('error:', err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT * FROM users
  WHERE id = $1`;

  return pool
    .query(queryString, [id])
    .then((result) => {
      if (!result.rows[0]) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log('error:', err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const queryString = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *`;

  const name = user.name;
  const email = user.email;
  const password = user.password;

  return pool
    .query(queryString, [name, email, password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log('error:', err.message);
    });

};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);

  const queryString = `SELECT properties.*, reservations.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN reservations ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2`;

  return pool
    .query(queryString, [guest_id, limit])
    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log('error:', err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }


  const filters = [options.city, options.maximum_price_per_night, options.minimum_price_per_night].filter((element) => (element !== undefined)).filter(element => element);

  if (filters.length) {
    queryString += `WHERE `
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100)
    if (queryString.includes('WHERE city')) {
      queryString += `AND `
    }
    queryString += `cost_per_night >= $${queryParams.length} `
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100)
    if (queryString.includes('WHERE city') || queryString.includes('WHERE cost')) {
      queryString += `AND `
    }
    queryString += `cost_per_night <= $${queryParams.length} `
  }

  queryString += `
  GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating)
    queryString += `HAVING avg(rating) >= $${queryParams.length} `
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);

  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`;

  const owner_id = property.owner_id;
  const title = property.title;
  const description = property.description;
  const thumbnail_photo_url = property.thumbnail_photo_url;
  const cover_photo_url = property.cover_photo_url;
  const cost_per_night = property.cost_per_night;
  const street = property.street;
  const city = property.city;
  const province = property.province;
  const post_code = property.post_code;
  const country = property.country;
  const parking_spaces = property.parking_spaces;
  const number_of_bathrooms = property.number_of_bathrooms;
  const number_of_bedrooms = property.number_of_bedrooms;

  return pool
    .query(queryString, [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log('error:', err.message);
    });

};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
