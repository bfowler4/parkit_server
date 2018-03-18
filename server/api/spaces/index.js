const express = require(`express`);
const router = express.Router();
const Space = require(`../../db/models/Space`);
const SpaceInReview = require(`../../db/models/SpaceInReview`);
const Reservation = require(`../../db/models/Reservation`);
const SpaceOccupied = require(`../../db/models/SpaceOccupied`);
const axios = require(`axios`);
module.exports = router;

const REVIEW_INTERVAL = `interval '60 second'`;

// Returns the closest open stall
router.route(`/request`)
.post((req, res) => {
  const {
    longitude,
    latitude
  } = req.body;

  return SpaceInReview
  .query(qb => {
    qb.whereRaw(`created_at + ${REVIEW_INTERVAL} < now()`)
  })
  .destroy() // Deletes all of the old spaces in review
  .then(() => {
    return SpaceOccupied
    .query(qb => {
      qb.whereRaw(`end_time < now()`);
    })
    .destroy(); // Deletes all of the old spaces in the occupied table
  })
  .then(() => {
    return Space
    .query(qb => {
      qb.leftJoin(
        `spaces_in_review`,
        `spaces_in_review.space_id`,
        `spaces.id`
      );
      qb.leftJoin(
        `spaces_occupied`,
        `spaces_occupied.space_id`,
        `spaces.id`
      );
      qb.whereRaw(`spaces_in_review.id is null and spaces_occupied.id is null and st_distance(location, st_makepoint(${longitude},${latitude})) < 10000`);
      qb.limit(25);
    })
    .fetchAll();
  })
  .then(spaces => {
    return spaces.toJSON();
  })
  .then(spaces => {
    if (!spaces.length) { // Throw error if no spaces available ???
      const err = new Error(`Sorry no spaces currently available nearby`);
      err.status = 200;
      throw err;
    }

    return axios.get(buildGoogleDistanceURL(latitude, longitude, spaces))
    .then(results => {
      const distances = results.data.rows[0].elements;
      const minimumDistanceIndex = getMinimumDistanceIndex(distances);
      return spaces[minimumDistanceIndex];
    });
  })
  .then(space => {
    res.json(space);
    return new SpaceInReview({ space_id: space.id })
    .save();
  })
  .catch(err => res.status(400).json({ message: err.message }));
});

router.route(`/reserve`)
.post((req, res) => {
  const {
    user_id,
    space_id
  } = req.body;
  let {
    start_time,
    end_time,
    time_requested
  } = req.body;
  const duration = (end_time - start_time) / 60;
  start_time = new Date(start_time * 1000).toISOString();
  end_time = new Date(end_time * 1000).toISOString();
  time_requested = new Date(time_requested * 1000).toISOString();

  return new Reservation({
    user_id,
    space_id,
    time_requested,
    start_time,
    end_time,
    duration
  })
  .save()
  .then(reservation => {
    return reservation.toJSON();
  })
  .then(reservation => {
    res.json(reservation);

    const { space_id, end_time } = reservation;
    return new SpaceOccupied({ space_id, end_time })
    .save();
  })
  .then(space => {
    return space.toJSON();
  })
  .then(space => {
    return SpaceInReview
    .where(`space_id`, space.space_id)
    .destroy();
  })
  .catch(err => res.status(400).json({ message: err.message }));
});

function buildGoogleDistanceURL(destinationLatitude, destinationLongitude, spaces) {
  let baseURL = `http://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&mode=walking&origins=${destinationLatitude},${destinationLongitude}&destinations=`;
  
  spaces.forEach((space, index) => {
    baseURL += space.latitude + `,` + space.longitude;
    if (index !== spaces.length - 1) {
      baseURL += `|`;
    }
  });
  return baseURL;
}

function getMinimumDistanceIndex(distances) {
  let min = 99999999;
  let minIndex = -1;

  distances.forEach((distance, index) => {
    if (distance.distance.value < min) {
      min = distance.distance.value;
      minIndex = index;
    }
  });
  return minIndex;
}