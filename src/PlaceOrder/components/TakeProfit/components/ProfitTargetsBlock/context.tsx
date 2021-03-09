import React, { createContext, useContext } from "react";

import { ProfitTargetsStore } from "./store/ProfitTargetsStore";

const store = new ProfitTargetsStore();
const storeContext = createContext(store);

const useStore = () => {
  return useContext(storeContext);
};

const StoreProvider: React.FC = ({ children }) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
);

export { useStore, StoreProvider };
