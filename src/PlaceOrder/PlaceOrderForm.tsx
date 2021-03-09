import React from "react";
import { observer } from "mobx-react";
import block from "bem-cn-lite";

import { NumberInput, Button } from "components";

import { BASE_CURRENCY, QUOTE_CURRENCY } from "./constants";
import { useStore } from "./context";
import { useStore as useProfitTargetsStrore } from "./components/TakeProfit/components/ProfitTargetsBlock/context";
import { PlaceOrderTypeSwitch } from "./components/PlaceOrderTypeSwitch/PlaceOrderTypeSwitch";
import { TakeProfit } from "./components/TakeProfit/TakeProfit";
import "./PlaceOrderForm.scss";

const b = block("place-order-form");

export const PlaceOrderForm = observer(() => {
  const {
    activeOrderSide,
    price,
    total,
    amount,
    setPrice,
    setTotal,
    setAmount,
    setOrderSide
  } = useStore();
  const { hasErrors, updateTargetPrices } = useProfitTargetsStrore();

  return (
    <form className={b()}>
      <div className={b("header")}>
        Binance: {`${BASE_CURRENCY} / ${QUOTE_CURRENCY}`}
      </div>
      <div className={b("type-switch")}>
        <PlaceOrderTypeSwitch
          activeOrderSide={activeOrderSide}
          onChange={setOrderSide}
        />
      </div>
      <div className={b("price")}>
        <NumberInput
          label="Price"
          value={price}
          onChange={(value) => {
            const newTargetPrice = Math.round(Number(value) * 100) / 100;
            setPrice(newTargetPrice);
            updateTargetPrices(
              newTargetPrice,
              activeOrderSide === "buy" ? 1 : -1
            );
          }}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
        />
      </div>
      <div className={b("amount")}>
        <NumberInput
          value={total / price || 0}
          label="Amount"
          onChange={(value) => {
            setAmount(Number(value));
            updateTargetPrices(price, activeOrderSide === "buy" ? 1 : -1);
          }}
          InputProps={{ endAdornment: BASE_CURRENCY }}
        />
      </div>
      <div className={b("total")}>
        <NumberInput
          value={price * amount}
          label="Total"
          onChange={(value) => {
            setTotal(Number(value));
          }}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
        />
      </div>
      <div className={b("take-profit")}>
        <TakeProfit orderSide={activeOrderSide} />
      </div>
      <div className="submit">
        <Button
          disabled={!(amount > 0 && price > 0 && !hasErrors)}
          color={activeOrderSide === "buy" ? "green" : "red"}
          type="submit"
          fullWidth
        >
          {activeOrderSide === "buy"
            ? `Buy ${BASE_CURRENCY}`
            : `Sell ${QUOTE_CURRENCY}`}
        </Button>
      </div>
    </form>
  );
});
