import {
  type DscvrFramesRequest,
  type DscvrValidationResponse,
  dscvrClientProtocolPrefix,
  DscvrUntrustedData,
} from './types';
import { DEFAULT_DSCVR_API_URL } from './default';
import { useUrqlClient } from './clients';
import { validationQuery } from './queries/validation.query';

type ValidationType = string | number | bigint | null | undefined;
interface ValidatedQueryResult {
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

export const validateClientProtocol = (clientProtocol: string) => {
  return clientProtocol.startsWith(dscvrClientProtocolPrefix);
};

const validateField = (
  validated: ValidationType,
  untrusted: ValidationType
): boolean => {
  return (!validated && !untrusted) || validated === untrusted;
};

const validateData = (
  validatedResult: DscvrValidationResponse,
  untrustedData: DscvrUntrustedData
): boolean => {
  const untrustedDataTransformed: DscvrUntrustedData = {
    ...untrustedData,
    timestamp: Number(untrustedData.timestamp), // TODO: remove this when Proxy is fixed
  };

  const isValidKey = (k: string): k is keyof DscvrValidationResponse =>
    k in validatedResult;

  const untrustedDataKeys = Object.keys(untrustedDataTransformed);
  const isValid = untrustedDataKeys.reduce((valid, key) => {
    if (isValidKey(key)) {
      return (
        valid &&
        validateField(validatedResult[key], untrustedDataTransformed[key])
      );
    }
    return false;
  }, true);

  return isValid;
};

export const validateFramesPost = async (
  payload: DscvrFramesRequest,
  apiUrl = DEFAULT_DSCVR_API_URL
): Promise<DscvrValidationResponse> => {
  const client = useUrqlClient(apiUrl);

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
  const hasContent = !!payload.untrustedData.contentId;
  if (!content && hasContent) {
    throw new Error('Invalid content');
  }

  const validatedResult: DscvrValidationResponse = {
    dscvrId: user.id,
    contentId: content?.id,
    inputText: queryResult.inputText || undefined,
    buttonIndex: queryResult.buttonIndex,
    state: queryResult.state || undefined,
    url: queryResult.url,
    timestamp: Number(queryResult.timestamp),
  };

  if (!validateData(validatedResult, payload.untrustedData)) {
    throw new Error('Invalid payload');
  }

  return validatedResult;
};
