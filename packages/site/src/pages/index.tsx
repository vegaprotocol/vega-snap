import { useContext } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  shouldDisplayReconnectButton,
  getChainId,
  listKeys,
  sendTransaction,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  GetChainIdButton,
  ListKeysButton,
  SendTransactionButton,
} from '../components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleGetChainIdClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Chain ID: ' + (await getChainId()).chainID,
      })
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleListKeysClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: (await listKeys()).keys.map(k => `Key "${k.name}" with public key ${k.publicKey}`).join(', '),
      })
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendTransferClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            transfer: {
              fromAccountType: 'ACCOUNT_TYPE_GENERAL',
              toAccountType: 'ACCOUNT_TYPE_GENERAL',

              // Vega
              asset:
                'fc7fd956078fb1fc9db5c19b88f0874c4299b2a7639ad05a47a28c0aef291b55',
              amount: '1',
              to: (await listKeys()).keys[0].publicKey,
              oneOff: {}
            }
          }
        }))),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendOrderClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            "orderSubmission": {
              "marketId": "3ab4fc0ea7e6eabe74133fb14ef2d8934ff21dd894ff080a09ec9a3647ceb2a4",
              "type": "TYPE_LIMIT",
              "side": "SIDE_BUY",
              "timeInForce": "TIME_IN_FORCE_GTC",
              "price": "200000000",
              "size": "1000",
              "postOnly": false,
              "reduceOnly": false,
              "icebergOpts": {
                "peakSize": "40",
                "minimumVisibleSize": "2"
              }
            }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

    const handleUpdateMarginModeClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            "updateMarginMode": {
              "marketId": "3ab4fc0ea7e6eabe74133fb14ef2d8934ff21dd894ff080a09ec9a3647ceb2a4",
		"mode": "MODE_ISOLATED_MARGIN",
		"marginFactor": "1.5"
            }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

    const handleCreateReferralSetClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            "createReferralSet": {
		"isTeam": true,
		"team": {
		    "name": "yolo bois",
		    "teamUrl": "https://yolo.boi",
		    "closed": true,
		    "allowList": [
			"3ab4fc0ea7e6eabe74133fb14ef2d8934ff21dd894ff080a09ec9a3647ceb2a4",
			"e6561f69c2a76858866aab2896eeb529b46040614566e0665602d67bc682c31f"
		    ]
		},
            }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

    const handleUpdateReferralSetClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            "updateReferralSet": {
		"id": "3ab4fc0ea7e6eabe74133fb14ef2d8934ff21dd894ff080a09ec9a3647ceb2a4",
		"isTeam": true,
		"team": {
		    "name": "yolo bois",
		    "teamUrl": "https://yolo.boi",
		    "closed": true,
		     "allowList": [
		     	"3ab4fc0ea7e6eabe74133fb14ef2d8934ff21dd894ff080a09ec9a3647ceb2a4",
		     	"e6561f69c2a76858866aab2896eeb529b46040614566e0665602d67bc682c31f"
		     ]
		},
            }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

    const handleUpdatePartyProfileClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
              "updatePartyProfile": {
		  "alias": "Best trader boi",
		  "metadata": [
		      {
			  "key": "color",
			  "value": "blue"
		      },
		      {
			  "key": "yolo",
			  "value": "true"
		      }
		  ]
              }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendCloseAllClick = async () => {
    try {
      dispatch({
        type: MetamaskActions.SetMessage,
        payload: 'Transaction sent with hash: ' + JSON.stringify((await sendTransaction({
          sendingMode: 'TYPE_SYNC',
          publicKey: (await listKeys()).keys[0].publicKey,
          transaction: {
            "batchMarketInstructions": {
              "cancellations": [
                {
                  "marketId": "e6561f69c2a76858866aab2896eeb529b46040614566e0665602d67bc682c31f",
                  "orderId": ""
                }
              ],
              "submissions": [
                {
                  "marketId": "e6561f69c2a76858866aab2896eeb529b46040614566e0665602d67bc682c31f",
                  "type": "TYPE_MARKET",
                  "timeInForce": "TIME_IN_FORCE_IOC",
                  "side": "SIDE_SELL",
                  "size": "16000",
                  "reduceOnly": true
                }
              ]
            }
          }
        })).transactionHash),
      })
    } catch (e) {
      console.error(JSON.stringify(e));
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>template-snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.ts</code>
      </Subtitle>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {state.message && (
          <Card content={{ title: 'Message', description: state.message }} fullWidth />
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.isFlask}
                />
              ),
            }}
            disabled={!state.isFlask}
          />
        )}
        {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={handleConnectClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Get Chain ID',
            description:
              'Fetch the current Chain ID.',
            button: (
              <GetChainIdButton
                onClick={handleGetChainIdClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Send simple transfer',
            description:
              'Send a simple vega transfer.',
            button: (
              <SendTransactionButton
                onClick={handleSendTransferClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'List Keys',
            description:
              'List all keys.',
            button: (
              <ListKeysButton
                onClick={handleListKeysClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Send iceberg order',
            description:
              'Send a GTC Iceberg order',
            button: (
              <SendTransactionButton
                onClick={handleSendOrderClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Update margin mode',
            description:
              'Update margin mode tx',
            button: (
              <SendTransactionButton
                onClick={handleUpdateMarginModeClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Create referral set',
            description:
              'Create referral set',
            button: (
              <SendTransactionButton
                onClick={handleCreateReferralSetClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Update party profile',
            description:
              'Update party profile',
            button: (
              <SendTransactionButton
                onClick={handleUpdatePartyProfileClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Update referral set',
            description:
              'Update referral set',
            button: (
              <SendTransactionButton
                onClick={handleUpdateReferralSetClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card
          content={{
            title: 'Send Console-like "Close"',
            description:
              'Send a transaction in the same fashion that the console would send if you press "Close" next to a position',
            button: (
              <SendTransactionButton
                onClick={handleSendCloseAllClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
