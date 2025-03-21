import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const fetchStories = createAsyncThunk(
  'story/fetchStories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/stories`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createStory = createAsyncThunk(
  'story/createStory',
  async (storyData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/stories`, storyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const generatePreview = createAsyncThunk(
  'story/generatePreview',
  async (previewData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/preview`, previewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  stories: [],
  currentStory: null,
  preview: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    setCurrentStory: (state, action) => {
      state.currentStory = action.payload;
    },
    updateStoryField: (state, action) => {
      const { field, value } = action.payload;
      if (state.currentStory) {
        state.currentStory[field] = value;
      }
    },
    clearPreview: (state) => {
      state.preview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stories
      .addCase(fetchStories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stories = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create story
      .addCase(createStory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stories.push(action.payload);
        state.currentStory = action.payload;
      })
      .addCase(createStory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Generate preview
      .addCase(generatePreview.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(generatePreview.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preview = action.payload;
      })
      .addCase(generatePreview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setCurrentStory, updateStoryField, clearPreview } = storySlice.actions;

export default storySlice.reducer;
