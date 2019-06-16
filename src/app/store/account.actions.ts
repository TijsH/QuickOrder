import ActionWithPayload from './ActionWithPayload';
import {IAccount} from './account.model';

export const SET_ACCOUNT = '[ACCOUNT] SET';

export class SetAccount implements ActionWithPayload<IAccount> {
  readonly type = SET_ACCOUNT;
  payload: IAccount;

  constructor(payload: IAccount) {
    this.payload = payload;
  }
}

export type All = SetAccount ;
