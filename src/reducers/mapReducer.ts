import { MAP_DATA } from "../redux/actionTypes";
import { getMapDataAction, MapData } from "../redux/types";

const initialState: MapData = [];

export const mapReducer = (state = initialState, action: getMapDataAction) => {
  switch (action.type) {
    case MAP_DATA:
      return action.payload;
    default:
      return initialState;
  }
};
export default mapReducer;
