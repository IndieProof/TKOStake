import React from "react";
import { BrowserRouter, Route,Switch } from "react-router-dom";
import MainPage from "./pages/MainPage";
function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={"/tko_stake"} component={MainPage} exact />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
