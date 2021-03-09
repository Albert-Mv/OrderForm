import { action, computed, observable } from "mobx";
import { OrderSide } from "PlaceOrder/model";
import {
  CheckTotalProps,
  ErrorTypes,
  ProfitTarget,
  TargetSubtypes,
  IDictionary
} from "../model";

const getMessageByErrorType = (
  type: ErrorTypes
): ((params?: any) => string) => {
  const dict: IDictionary = {};
  dict[ErrorTypes.UNKNOWN] = () => "An unknown error occured";
  dict[ErrorTypes.PROFIT_LESS_THEN_PREVIOUS] = () =>
    "Each target's 'Profit' should be greater than the previous one";
  dict[ErrorTypes.PROFIT_MINIMUM_VALUE] = () => "Minimum value is 0.01";
  dict[ErrorTypes.PROFIT_TOTAL_ERROR] = () => "Maximum profit sum is 500%";
  dict[ErrorTypes.AMOUNT_TOTAL_ERROR] = (currentTotal: number) =>
    `${
      currentTotal + 100
    } out of 100% selected. Please decrease by ${currentTotal}`;
  dict[ErrorTypes.AMOUNT_MUST_BE_GREATER_THEN_ZERO] = (
    invertedOrderSide: OrderSide
  ) =>
    `Each target's 'Amount to ${invertedOrderSide}' should be greatest than zero`;
  dict[ErrorTypes.TARGET_MUST_BE_GREATER_THEN_ZERO] = () =>
    "Each target's 'Trade price' should be greatest than zero";

  return dict[type];
};

const makeError = (
  type: TargetSubtypes,
  errorType: ErrorTypes,
  params?: any
) => {
  return { type, errorType, message: getMessageByErrorType(errorType)(params) };
};

export class ProfitTargetsStore {
  @observable profitTargets: Array<ProfitTarget> = [];
  @observable errorTypes = ErrorTypes;

  @action
  calculateTargetPrice = (
    price: number | null,
    profit: number | null,
    coefficient: number
  ) => {
    const prepPrice = Math.round(Number(price) * 100) / 100;
    const prepProfit = Math.round(Number(profit) * 100) / 100;
    return prepPrice * (1 + (prepProfit * coefficient) / 100);
  };

  @action
  handleAmount = (item: ProfitTarget, val: number, orderSide: OrderSide) => {
    item.setAmountPercent(val);
    this.validateAmount(orderSide === "buy" ? "sell" : "buy");
  };

  @action
  handleTargetPrice = (
    item: ProfitTarget,
    val: number,
    price: number,
    coefficient: number
  ) => {
    item.setProfit(this.getProjectedProfitPercent(price, coefficient, val));
  };

  @action
  updateTargetPrices = (price: number, coefficient: number) => {
    this.profitTargets.forEach((item) => {
      item.setTargetPrice(
        this.calculateTargetPrice(price, item.getProfit, coefficient)
      );
    });
  };

  @computed
  get hasErrors(): boolean {
    return this.profitTargets.some((item) => item.hasErrors);
  }

  @action
  cleanProfitTargets = () => {
    this.profitTargets = [];
  };

  @action
  addCondition = (price: number, coefficient: number) => {
    if (this.profitTargets.length) {
      const profit =
        this.profitTargets[this.profitTargets.length - 1].getProfit + 2;
      const targetPrice = this.calculateTargetPrice(price, profit, coefficient);
      this.profitTargets.push(new ProfitTarget(profit, targetPrice, 20));
    } else {
      this.profitTargets.push(
        new ProfitTarget(
          2,
          this.calculateTargetPrice(price, 2, coefficient),
          100
        )
      );
    }
    this.checkAmountPercentTotal(true);
    this.validateProfits();
  };

  @action
  getProjectedProfitPercent = (
    price: number,
    coefficient: number,
    targetPrice: number
  ) => {
    const profit = targetPrice - price;
    return price ? Math.round(((profit * coefficient) / price) * 100) : 0;
  };

  @action
  getProjectedProfitTotal = (
    price: number,
    amount: number,
    coefficient: number
  ) => {
    return Object.keys(this.profitTargets)
      .reduce((sum, key, index) => {
        const item = this.profitTargets[index];
        const amountPercent = item.amountPercent;
        const profit = item.getTargetPrice - price;

        return sum + (coefficient * profit * amount * amountPercent) / 100;
      }, 0)
      .toFixed(2);
  };

  @action
  removeCondition = (index: number, setIsChecked: (logic: boolean) => void) => {
    if (this.profitTargets.length === 1) {
      setIsChecked(false);
    }
    this.profitTargets.splice(index, 1);
  };

  @action
  cleanErrorsByErrorType(type: ErrorTypes) {
    this.profitTargets.forEach((item) => {
      item.cleanErrorsByErrorType(type);
    });
  }

  @action
  handleErrorCase = (
    isError: boolean,
    type: TargetSubtypes,
    errorType: ErrorTypes,
    index: number,
    params?: any
  ) => {
    if (isError) {
      const err = makeError(type, errorType, params);
      this.profitTargets[index].setError(err);
    } else {
      this.profitTargets[index].cleanErrorsByErrorType(errorType);
    }
  };

  @action
  checkProfitMinimum(isLess: boolean, index: number) {
    const errorType = this.errorTypes.PROFIT_MINIMUM_VALUE;
    this.handleErrorCase(isLess, "profit", errorType, index);
  }

  @action
  checkProfitLessThenPrevious(isLess: boolean, index: number) {
    const errorType = this.errorTypes.PROFIT_LESS_THEN_PREVIOUS;
    this.handleErrorCase(Boolean(index) && isLess, "profit", errorType, index);
  }

  @action
  checkErrProfitTotal(index: number) {
    const isGreatest = this.checkProfitTotal(false);
    const errorType = this.errorTypes.PROFIT_TOTAL_ERROR;
    this.handleErrorCase(
      Boolean(isGreatest),
      "profit",
      errorType,
      index,
      isGreatest
    );
  }

  @action
  validateProfits = () => {
    Object.keys(this.profitTargets).reduce((profit, key, index) => {
      const currentProfit = this.profitTargets[index].getProfit;
      this.checkProfitMinimum(profit < 0.01, index);
      this.checkProfitLessThenPrevious(profit >= currentProfit, index);
      this.checkErrProfitTotal(index);

      return currentProfit;
    }, this.profitTargets[0].getProfit);
  };

  @action
  handleProfit = (
    item: ProfitTarget,
    val: number,
    price: number,
    coefficient: number
  ) => {
    item.setTargetPrice(this.calculateTargetPrice(price, val, coefficient));
    this.validateProfits();
    this.checkProfitTotal(true);
    this.validateTargetPrices();
  };

  @action
  checkErrAmountPercentTotal(index: number) {
    const isGreatest = this.checkAmountPercentTotal(false);
    const errorType = this.errorTypes.AMOUNT_TOTAL_ERROR;
    this.handleErrorCase(
      Boolean(isGreatest),
      "amount",
      errorType,
      index,
      isGreatest
    );
  }

  @action
  checkAmountZeroOrLess(isZeroOrLess: boolean, index: number, params: string) {
    const errorType = this.errorTypes.AMOUNT_MUST_BE_GREATER_THEN_ZERO;
    this.handleErrorCase(isZeroOrLess, "amount", errorType, index, params);
  }

  @action
  validateAmount = (orderSide: string) => {
    this.profitTargets.forEach((item, index) => {
      this.checkErrAmountPercentTotal(index);
      this.checkAmountZeroOrLess(0 >= item.getAmountPercent, index, orderSide);
    });
  };

  @action
  checkPriceZeroOrLess = (isZeroOrLess: boolean, index: number) => {
    const errorType = this.errorTypes.TARGET_MUST_BE_GREATER_THEN_ZERO;
    this.handleErrorCase(isZeroOrLess, "targetPrice", errorType, index);
  };

  @action
  validateTargetPrices = () => {
    this.profitTargets.forEach((item, index) => {
      this.checkPriceZeroOrLess(0 >= item.getTargetPrice, index);
    });
  };

  @action
  checkProfitTotal = (auto: boolean) => {
    return this.checkTotal({
      totalMax: 500,
      get: "getProfit",
      set: "setProfit",
      auto,
      errorType: ErrorTypes.PROFIT_TOTAL_ERROR
    });
  };

  @action
  checkAmountPercentTotal = (auto: boolean) => {
    return this.checkTotal({
      totalMax: 100,
      get: "getAmountPercent",
      set: "setAmountPercent",
      auto,
      errorType: ErrorTypes.AMOUNT_TOTAL_ERROR
    });
  };

  @action
  checkTotal = ({
    totalMax,
    get,
    set,
    auto = true,
    errorType
  }: CheckTotalProps) => {
    const total = Object.keys(this.profitTargets).reduce((sum, key) => {
      return sum + this.profitTargets[parseInt(key, 10)][get];
    }, 0);
    if (total > totalMax) {
      const maxValue = Math.max(...this.profitTargets.map((item) => item[get]));
      if (auto) {
        const newValue = maxValue + totalMax - total;
        this.profitTargets
          .find((item) => {
            return item[get] === maxValue;
          })!
          [set](newValue); // eslint-disable-line
        this.cleanErrorsByErrorType(errorType);
      } else {
        const delta = total - totalMax;
        return delta > 0 ? delta : 0;
      }
    }
    return 0;
  };
}
