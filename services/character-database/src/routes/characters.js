const express = require('express');
const characterController = require('../controllers/characterController');

const router = express.Router();

router
  .route('/')
  .get(characterController.getAllCharacters)
  .post(characterController.createCharacter);

router
  .route('/:id')
  .get(characterController.getCharacter)
  .patch(characterController.updateCharacter)
  .delete(characterController.deleteCharacter);

router
  .route('/universe/:universeId')
  .get(characterController.getCharactersByUniverse);

router
  .route('/:characterId/compatible')
  .get(characterController.getCompatibleCharacters);

router
  .route('/:characterId/popularity')
  .patch(characterController.updatePopularity);

module.exports = router;
