const express = require(`express`);
const router = express.Router();
const Space = require(`../../db/models/Space`);
const SpaceInReview = require(`../../db/models/SpaceInReview`);
const Reservation = require(`../../db/models/Reservation`);
const SpaceOccupied = require(`../../db/models/SpaceOccupied`);
const axios = require(`axios`);
const googleKey = require(`../../../config/index`).google.key;
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
      qb.limit(1);
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
    return spaces[0];
  })
  .then(space => {
    res.json(space);
    return new SpaceInReview({ space_id: space.id })
    .save();
  })
  .catch(err => {
    console.log(err.message);
    res.status(400).json({ message: err.message })
  });
});

router.route(`/reserve`)
.post((req, res) => {
  const { space_id } = req.body;
  const user_id = req.user.id;
  let {
    start_time,
    end_time,
    time_requested
  } = req.body;
  const duration = Math.ceil((end_time - start_time) / 60 / 1000);
  const price = Math.ceil(duration * 0.033333333 * 100) / 100;
  start_time = new Date(start_time).toISOString();
  end_time = new Date(end_time).toISOString();
  time_requested = new Date(time_requested).toISOString();

  return new Reservation({
    user_id,
    space_id,
    time_requested,
    start_time,
    end_time,
    duration,
    price
  })
  .save()
  .then(reservation => {
    reservation = reservation.toJSON();
    return new Reservation({ id: reservation.id })
    .fetch({ withRelated: [`space`, `space.address`] });
  })
  .then(reservation => {
    reservation = reservation.toJSON();
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
  .catch(err => {
    res.status(400).json({ message: err.message })
  });
});

function buildGoogleDistanceURL(destinationLatitude, destinationLongitude, spaces) {
  let baseURL = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&mode=walking&origins=${destinationLatitude},${destinationLongitude}&destinations=`;
  
  spaces.forEach((space, index) => {
    baseURL += space.latitude + `,` + space.longitude;
    if (index !== spaces.length - 1) {
      baseURL += `|`;
    }
  });
  baseURL += `&key=${googleKey}`;
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