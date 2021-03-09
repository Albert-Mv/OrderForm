import { action, computed, observable } from "mobx";

export type TargetSubtypes = "profit" | "targetPrice" | "amount";

export type ProfitTargetsBlockProps = {
  setIsChecked: (logic: boolean) => void;
};

export enum ErrorTypes {
  UNKNOWN,
  PROFIT_LESS_THEN_PREVIOUS,
  PROFIT_TOTAL_ERROR,
  PROFIT_MINIMUM_VALUE,
  AMOUNT_TOTAL_ERROR,
  AMOUNT_MUST_BE_GREATER_THEN_ZERO,
  TARGET_MUST_BE_GREATER_THEN_ZERO
}

type ErrorProps = {
  type: "profit" | "targetPrice" | "amount";
  errorType: ErrorTypes;
  message: string;
};

export interface IDictionary {
  [key: number]: (params?: any) => string;
}

export type CheckTotalProps = {
  totalMax: number;
  auto: boolean;
  get: "getAmountPercent" | "getProfit" | "getTargetPrice";
  set: "setProfit" | "setTargetPrice" | "setAmountPercent";
  errorType: ErrorTypes;
};

export class ProfitTargetError implements ErrorProps {
  @observable type: "profit" | "targetPrice" | "amount";
  @observable errorType: ErrorTypes;
  @observable message: string;

  constructor({ type, errorType, message }: ErrorProps) {
    this.type = type;
    this.errorType = errorType;
    this.message = message;
  }

  @action.bound
  getType() {
    return this.type;
  }

  @action.bound
  getErrorType() {
    return this.errorType;
  }

  @action.bound
  getMessage() {
    return this.message;
  }
}

export class ProfitTarget {
  @observable profit: number;
  @observable targetPrice: number;
  @observable amountPercent: number;
  @observable errors: Array<ProfitTargetError>;

  constructor(profit: number, targetPrice: number, amountPercent: number) {
    this.profit = profit;
    this.targetPrice = targetPrice;
    this.amountPercent = amountPercent;
    this.errors = [];
  }

  isNull(val: number | null): boolean {
    return val === null;
  }

  @computed
  get getProfit(): number {
    return this.profit;
  }

  @action.bound
  setProfit(profit: number | null) {
    if (this.isNull(profit)) {
      return;
    }
    this.profit = profit!;
  }

  @computed
  get getTargetPrice(): number {
    return this.targetPrice;
  }

  @action.bound
  setTargetPrice(targetPrice: number | null) {
    if (this.isNull(targetPrice)) {
      return;
    }
    this.targetPrice = targetPrice!;
  }

  @computed
  get getAmountPercent(): number {
    return this.amountPercent;
  }

  @action.bound
  setAmountPercent(amountPercent: number | null) {
    if (this.isNull(amountPercent)) {
      return;
    }
    this.amountPercent = amountPercent!;
  }

  @action.bound
  setError({ type, errorType, message }: ErrorProps) {
    const hasError = this.errors.some((item) => {
      if (item.getErrorType() === errorType) {
        item.message = message;
        return true;
      }
      return false;
    });
    if (!hasError) {
      this.errors.push(new ProfitTargetError({ type, errorType, message }));
    }
  }

  @computed
  get hasErrors(): boolean {
    return !!this.errors.length;
  }

  private getErrorsByType(
    type: "profit" | "targetPrice" | "amount"
  ): Array<ProfitTargetError> {
    return this.errors.filter((item) => item.getType() === type);
  }

  @computed
  get profitErrors(): Array<ProfitTargetError> {
    return this.getErrorsByType("profit");
  }

  @computed
  get targetPriceErrors(): Array<ProfitTargetError> {
    return this.getErrorsByType("targetPrice");
  }

  @computed
  get amountErrors(): Array<ProfitTargetError> {
    return this.getErrorsByType("amount");
  }

  @action.bound
  cleanErrorsByErrorType(errorType: ErrorTypes) {
    this.errors.forEach((item, index) => {
      if (item.getErrorType() === errorType) {
        this.errors.splice(index, 1);
        return;
      }
    });
  }
}
