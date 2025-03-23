import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentStory: {
    universeType: '',
    selectedUniverses: [],
    mainCharacter: null,
    supportingCharacters: [],
    theme: '',
    moral: '',
    childName: '',
    ageGroup: '',
    readingLevel: '',
    storyLength: '',
    mediaOptions: []
  },
  savedStories: [],
  generatedStory: null,
  loading: false,
  error: null
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    updateStoryField: (state, action) => {
      const { field, value } = action.payload;
      state.currentStory[field] = value;
    },
    resetCurrentStory: (state) => {
      state.currentStory = initialState.currentStory;
    },
    generateStoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    generateStorySuccess: (state, action) => {
      state.loading = false;
      state.generatedStory = action.payload;
      state.error = null;
    },
    generateStoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    saveStoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    saveStorySuccess: (state, action) => {
      state.loading = false;
      state.savedStories.push(action.payload);
      state.error = null;
    },
    saveStoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchStoriesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStoriesSuccess: (state, action) => {
      state.loading = false;
      state.savedStories = action.payload;
      state.error = null;
    },
    fetchStoriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteStoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteStorySuccess: (state, action) => {
      state.loading = false;
      state.savedStories = state.savedStories.filter(
        story => story.id !== action.payload
      );
      state.error = null;
    },
    deleteStoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { 
  updateStoryField,
  resetCurrentStory,
  generateStoryStart,
  generateStorySuccess,
  generateStoryFailure,
  saveStoryStart,
  saveStorySuccess,
  saveStoryFailure,
  fetchStoriesStart,
  fetchStoriesSuccess,
  fetchStoriesFailure,
  deleteStoryStart,
  deleteStorySuccess,
  deleteStoryFailure
} = storySlice.actions;

export default storySlice.reducer;
