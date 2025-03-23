import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: false,
  sidebarOpen: false,
  notifications: [],
  activeTab: 0
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    }
  }
});

export const { 
  toggleDarkMode,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setActiveTab
} = uiSlice.actions;

export default uiSlice.reducer;
