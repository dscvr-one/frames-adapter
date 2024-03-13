import { OpenFramesUntrustedData } from '@open-frames/types';
import { Client, cacheExchange, fetchExchange } from '@urql/core';
import {
  type DscvrFramesRequest,
  type DscvrValidationResponse,
  dscvrClientProtocolPrefix,
  DscvrUntrustedData,
} from './types';
import { DEFAULT_DSCVR_API_URL } from './default';

type ValidationType = string | number | bigint | null | undefined;
interface ValidatedQueryResult {
  user: {
    id: string;
  };
  content?: {
    id: bigint;
  };
  state: string | null;
  inputText: string | null;
  timestamp: string;
  url: string;
  buttonIndex: number;
}

const validationQuery = `#graphql
    query validate($message: String!) {
      unpackFrameMessage(message: $message) {
        user {
            id
        },
        content {
            id
        }
        buttonIndex,
        state,
        url,
        timestamp,
        inputText,
      }
    }
`;

export const validateClientProtocol = (clientProtocol: string) => {
  return clientProtocol.startsWith(dscvrClientProtocolPrefix);
};

const validateUntrustedDataValue = (
  validated: ValidationType,
  untrusted: ValidationType
): boolean => {
  if (!validated && !untrusted) {
    return true;
  }
  if (validated && untrusted && validated === untrusted) {
    return true;
  }
  return false;
};

const validateUntrustedData = (
  validatedResult: DscvrValidationResponse,
  untrustedData: DscvrUntrustedData
): boolean => {
  if (
    validateUntrustedDataValue(
      validatedResult.validatedDscvrId,
      untrustedData.dscvrId
    ) &&
    validateUntrustedDataValue(
      validatedResult.validatedContentId,
      untrustedData.contentId
    ) &&
    validateUntrustedDataValue(
      validatedResult.buttonIndex,
      untrustedData.buttonIndex
    ) &&
    validateUntrustedDataValue(validatedResult.frameUrl, untrustedData.url) &&
    validateUntrustedDataValue(
      validatedResult.inputText,
      untrustedData.inputText
    ) &&
    validateUntrustedDataValue(validatedResult.state, untrustedData.state) &&
    validateUntrustedDataValue(
      validatedResult.timestamp,
      Number(untrustedData.timestamp) // TODO: remove this when Proxy is fixed
    )
  ) {
    return true;
  }

  return false;
};

export const validateFramesPost = async (
  payload: DscvrFramesRequest,
  url = DEFAULT_DSCVR_API_URL
): Promise<DscvrValidationResponse> => {
  const client = new Client({
    url,
    exchanges: [cacheExchange, fetchExchange],
  });

  const result = await client.query<
    { unpackFrameMessage: ValidatedQueryResult },
    { message: string }
  >(validationQuery, {
    message: payload.trustedData.messageBytes,
  });

  if (!result.data) {
    throw new Error(`Invalid request: ${result.error?.message}`);
  }
  const queryResult = result.data.unpackFrameMessage;

  const user = queryResult.user;
  const content = queryResult.content;
  const hasContent = typeof payload.untrustedData.contentId === 'bigint';
  if (!content && hasContent) {
    throw new Error('Invalid content');
  }

  const validatedResult: DscvrValidationResponse = {
    validatedDscvrId: user.id,
    validatedContentId: content?.id ?? null,
    inputText: queryResult.inputText ?? null,
    buttonIndex: queryResult.buttonIndex,
    state: queryResult.state,
    frameUrl: queryResult.url,
    timestamp: Number(queryResult.timestamp),
  };

  if (!validateUntrustedData(validatedResult, payload.untrustedData)) {
    throw new Error('Invalid payload');
  }

  return validatedResult;
};
