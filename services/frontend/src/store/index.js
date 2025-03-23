import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import storyReducer from './slices/storySlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    story: storyReducer,
    ui: uiReducer
  }
});

export default store;
