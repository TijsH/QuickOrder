import ActionWithPayload from './ActionWithPayload';
import {IAccess} from './access.model';

export const SET_ACCESS = '[ACCESS] SET';

export class SetAccess implements ActionWithPayload<IAccess> {
  readonly type = SET_ACCESS;
  payload: IAccess;

  constructor(payload: IAccess) {
    this.payload = payload;
  }
}

export type All = SetAccess ;
