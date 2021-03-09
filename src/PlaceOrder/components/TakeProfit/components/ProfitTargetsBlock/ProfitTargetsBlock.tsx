import React from "react";
import { AddCircle, Cancel } from "@material-ui/icons";
import { observer } from "mobx-react";
import block from "bem-cn-lite";

import { QUOTE_CURRENCY } from "../../../../constants";

import { TextButton, NumberInput } from "components";
import { useStore } from "../ProfitTargetsBlock/context";
import { useStore as usePlaceOrderStore } from "PlaceOrder/context";
import { ProfitTarget, ProfitTargetsBlockProps } from "./model";

const b = block("take-profit");

export const ProfitTargetsBlock = observer(
  ({ setIsChecked }: ProfitTargetsBlockProps) => {
    const {
      addCondition,
      checkAmountPercentTotal,
      handleAmount,
      handleProfit,
      handleTargetPrice,
      getProjectedProfitTotal,
      profitTargets,
      removeCondition,
      validateProfits,
      validateTargetPrices
    } = useStore();
    // Пока не читал на тему mobx, но есть ощущение, что
    // стор дложен быть в главном(родительском) компоненте,
    // а уже оттуда он мог бы тянуть другие сторы и их методы.
    // Это позволит избежать петель/лишних зависимостей
    // в больших проектах. Лишь предположение, могу ошибаться

    const { activeOrderSide, price, amount } = usePlaceOrderStore();
    const coefficient = activeOrderSide === "buy" ? 1 : -1;
    // eslint-disable-next-line
    !Boolean(profitTargets.length) && addCondition(price, coefficient);

    function renderInputs() {
      return profitTargets?.map((item: ProfitTarget, index: number) => {
        const profit = item.getProfit;
        const targetPrice = item.targetPrice;
        const amountPercent = item.getAmountPercent;

        return (
          <div key={index} className={b("inputs")}>
            <NumberInput
              value={profit}
              onChange={(val) => {
                item.setProfit(val);
                validateProfits();
              }}
              error={item.profitErrors
                .map((item) => item.getMessage())
                .join(" | ")}
              onBlur={(val) =>
                handleProfit(item, Number(val), price, coefficient)
              }
              decimalScale={2}
              InputProps={{ endAdornment: "%" }}
              variant="underlined"
            />
            <NumberInput
              value={targetPrice}
              onChange={(val) => {
                item.setTargetPrice(val);
                validateTargetPrices();
              }}
              onBlur={(val) => {
                handleTargetPrice(item, Number(val), price, coefficient);
              }}
              error={item.targetPriceErrors
                .map((item) => item.getMessage())
                .join(" | ")}
              decimalScale={2}
              InputProps={{ endAdornment: QUOTE_CURRENCY }}
              variant="underlined"
            />
            <NumberInput
              value={amountPercent}
              onChange={(val) => {
                handleAmount(item, Number(val), activeOrderSide);
              }}
              error={item.amountErrors
                .map((item) => item.getMessage())
                .join(" | ")}
              onBlur={() => checkAmountPercentTotal(true)}
              decimalScale={2}
              InputProps={{ endAdornment: "%" }}
              variant="underlined"
            />
            <div className={b("cancel-icon")}>
              <Cancel onClick={() => removeCondition(index, setIsChecked)} />
            </div>
          </div>
        );
      });
    }

    function addConditionButton() {
      return (
        <TextButton
          onClick={() => addCondition(price, coefficient)}
          className={b("add-button")}
        >
          <AddCircle className={b("add-icon")} />
          <span>{`Add profit target ${profitTargets.length}/5`}</span>
        </TextButton>
      );
    }

    return (
      <>
        {renderInputs()}
        {profitTargets.length !== 5 && addConditionButton()}
        <div className={b("projected-profit")}>
          <span className={b("projected-profit-title")}>Projected profit</span>
          <span className={b("projected-profit-value")}>
            <span>{getProjectedProfitTotal(price, amount, coefficient)}</span>
            <span className={b("projected-profit-currency")}>
              {QUOTE_CURRENCY}
            </span>
          </span>
        </div>
      </>
    );
  }
);
