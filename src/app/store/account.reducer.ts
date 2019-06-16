import {Action} from '@ngrx/store';
import ActionWithPayload from './ActionWithPayload';
import * as AccountActions from './account.actions';
import {IAccount} from './account.model';

export function AccountReducer(state: IAccount = {number: ''},
                               action: Action) {

  switch (action.type) {
    case AccountActions.SET_ACCOUNT:
      return {
        ...state,
        ...(action as ActionWithPayload<IAccount>).payload
      };

    default:
      return state;
  }
}
