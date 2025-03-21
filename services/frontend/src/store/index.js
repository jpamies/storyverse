import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import storyReducer from './slices/storySlice';
import universeReducer from './slices/universeSlice';
import characterReducer from './slices/characterSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    story: storyReducer,
    universe: universeReducer,
    character: characterReducer,
  },
});

export default store;
