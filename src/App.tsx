import React from "react";
import { Provider } from "react-redux";
import store from "./redux/store";
import MapClean from "./components/MapClean/MapClean";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";

const App = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <MapClean />
      </div>
    </Provider>
  );
};

export default App;
