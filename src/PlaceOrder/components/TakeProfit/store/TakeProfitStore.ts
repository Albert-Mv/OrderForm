import { action, observable } from "mobx";

export class TakeProfitStore {
  @observable isChecked: boolean = false;

  @action.bound
  setIsChecked(logic: boolean) {
    this.isChecked = logic;
  }
}
