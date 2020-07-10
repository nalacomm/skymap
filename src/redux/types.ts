import { APP_ERROR, APP_MESSAGES, APP_SUCCESS, MAP_DATA } from "./actionTypes";

export interface MapData {
  [index: number]: {
    Caldwell_Messier: string;
    Name: string;
    L: number;
    B: number;
    Longitude: number;
    Latitude: number;
  };
}

export interface getMapDataAction {
  type: typeof MAP_DATA;
  payload: MapData;
}
