import {IAccess} from './access.model';

export interface IAppState {
  binck: IAccess;
}

export const initializeState = (): IAppState => ({
  binck: {},
});

