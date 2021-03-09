/* eslint @typescript-eslint/no-use-before-define: 0 */

import React from "react";
import block from "bem-cn-lite";

import { Switch } from "components";

import { ProfitTargetsBlock } from "./components/ProfitTargetsBlock/ProfitTargetsBlock";
import { OrderSide } from "../../model";
import { useStore as useProfitTargetsStore } from "./components/ProfitTargetsBlock/context";
import { useStore } from "./context";
import "./TakeProfit.scss";
import { observer } from "mobx-react";

const b = block("take-profit");

type Props = {
  orderSide: OrderSide;
};

const TakeProfit = observer(({ orderSide }: Props) => {
  const { cleanProfitTargets } = useProfitTargetsStore();
  const { isChecked, setIsChecked } = useStore();
  // Можно ли использовать хуки & mobx одновременно?
  // const [checked, setChecked] = useState<boolean>(false);

  const onChange = () => {
    setIsChecked(!isChecked);
    // eslint-disable-next-line
    !isChecked && cleanProfitTargets();
  };

  function renderTitles() {
    return (
      <div className={b("titles")}>
        <span>Profit</span>
        <span>Trade price</span>
        <span>Amount to {orderSide === "buy" ? "sell" : "buy"}</span>
      </div>
    );
  }

  return (
    <div className={b()}>
      <div className={b("switch")}>
        <span>Take profit</span>
        <Switch onChange={onChange} checked={isChecked} />
      </div>
      <div className={b("content")}>
        {renderTitles()}
        {isChecked && <ProfitTargetsBlock setIsChecked={setIsChecked} />}
      </div>
    </div>
  );
});

export { TakeProfit };
