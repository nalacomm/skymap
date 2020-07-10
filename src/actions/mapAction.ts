import { MAP_DATA } from "../redux/actionTypes";
import dataD from "../data/Wise_coord_2020.json";

export const getMapData: any = () => {
  return (dispatch: any): void => {
    dispatch({
      type: MAP_DATA,
      payload: dataD,
    });
  };
};
