import { combineReducers } from "redux";
import mapReducer from "../reducers/mapReducer";

export const rootReducer = combineReducers({
  mapData: mapReducer,
});

export default rootReducer;
