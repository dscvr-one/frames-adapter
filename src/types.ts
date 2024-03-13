import type {
  OpenFramesTrustedData,
  OpenFramesUntrustedData,
} from '@open-frames/types';

export type DscvrUntrustedData = OpenFramesUntrustedData & {
  dscvrId: string;
  contentId?: bigint | null;
  state?: string;
};
export const dscvrClientProtocolPrefix = 'dscvr@' as const;
export type DscvrClientProtocol =
  `${typeof dscvrClientProtocolPrefix}${string}`;

export interface DscvrFramesRequest {
  clientProtocol: DscvrClientProtocol;
  untrustedData: DscvrUntrustedData;
  trustedData: OpenFramesTrustedData;
}

export type DscvrValidationResponse = {
  validatedDscvrId: string;
  validatedContentId: bigint | null;
  frameUrl: string;
  timestamp: number;
  buttonIndex: number;
  inputText: string | null;
  state: string | null;
};
