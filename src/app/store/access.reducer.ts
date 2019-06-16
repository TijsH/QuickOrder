import {Action} from '@ngrx/store';
import ActionWithPayload from './ActionWithPayload';
import * as AccessActions from './access.actions';
import {IAccess} from './access.model';

export function AccessReducer(state: IAccess = {},
                              action: Action) {

  switch (action.type) {
    case AccessActions.SET_ACCESS:
      return {
        ...state,
        ...(action as ActionWithPayload<IAccess>).payload
      };

    default:
      return state;
  }
}
