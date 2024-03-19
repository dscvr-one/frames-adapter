import type {
  OpenFramesTrustedData,
  OpenFramesUntrustedData,
} from '@open-frames/types';
import { dscvrClientProtocolPrefix } from './constants';

export type DscvrUntrustedData = OpenFramesUntrustedData & {
  dscvrId: string;
  contentId?: string;
  state?: string;
};

export type DscvrClientProtocol =
  `${typeof dscvrClientProtocolPrefix}${string}`;

export interface DscvrFramesRequest {
  clientProtocol: DscvrClientProtocol;
  untrustedData: DscvrUntrustedData;
  trustedData: OpenFramesTrustedData;
}

export interface DscvrValidationResponse extends DscvrUntrustedData {}


export type ValidationType = string | number | bigint | null | undefined;
export interface ValidatedQueryResult {
  user: {
    id: string;
  };
  content?: {
    id: string;
  };
  state: string | null;
  inputText: string | null;
  timestamp: string;
  url: string;
  buttonIndex: number;
}