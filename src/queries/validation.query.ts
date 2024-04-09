export const validationQuery = `#graphql
    query validate($message: String!) {
      unpackFrameMessage(message: $message) {
        user {
            id
        },
        content {
            id
        },
        buttonIndex,
        state,
        url,
        timestamp,
        inputText,
        transactionId,
        address,
      }
    }
`;
