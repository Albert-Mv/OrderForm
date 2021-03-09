import React, { createContext, useContext } from "react";

import { TakeProfitStore } from "./store/TakeProfitStore";

const store = new TakeProfitStore();
const storeContext = createContext(store);

const useStore = () => {
  return useContext(storeContext);
};

const StoreProvider: React.FC = ({ children }) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
);

export { useStore, StoreProvider };
