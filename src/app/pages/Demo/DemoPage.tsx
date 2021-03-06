import { empty } from 'rxjs';
import * as React from 'react';
import { Form } from 'react-final-form';
import BN from 'bn.js';

import { useApi } from 'services/api';
import { AuthButton } from 'features/auth';
import { DecimalsField, TextInputField } from 'components/form';
import { Typography, Loading, CircularProgress, Hint, Button, Grid } from 'components';
import { useSubscribable } from 'utils/react';
import { composeValidators, validateInteger, validatePositiveNumber } from 'utils/validators';

import { DaiBalance } from './DaiBalance';

export function DemoPage() {
  const api = useApi();
  const [account, accountMeta] = useSubscribable(() => api.web3Manager.account, [], null);
  const [balance, balanceMeta] = useSubscribable(() => {
    return account ? api.getDaiBalance$(account) : empty();
  }, [account]);

  const initialFormValues = React.useMemo(
    () => ({
      amount: '',
      name: '',
      surname: '',
    }),
    [],
  );

  const validate = React.useMemo(() => {
    return composeValidators(validateInteger, validatePositiveNumber);
  }, []);

  const onSubmit = React.useCallback(
    async (values: { amount: string; name: string; surname: string }) => {
      account && (await api.transferDai$(account, account, new BN(0)));
      // eslint-disable-next-line no-console
      console.log(values);
    },
    [account],
  );

  return (
    <div>
      <AuthButton />
      <Typography variant="h4" gutterBottom>
        Page for developers
      </Typography>
      <Grid container justify="center" spacing={2}>
        <Grid item xs={5}>
          <Form
            onSubmit={onSubmit}
            initialValues={initialFormValues}
            subscription={{ submitError: true, submitting: true }}
          >
            {({ handleSubmit, submitError, submitting }) => (
              <form onSubmit={handleSubmit}>
                <Grid container justify="center" spacing={2}>
                  <Grid item xs={12}>
                    <DecimalsField
                      validate={validate}
                      baseDecimals={0}
                      baseUnitName="DAI"
                      name="amount"
                      placeholder="amount"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextInputField variant="outlined" fullWidth name="name" placeholder="name" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextInputField
                      variant="outlined"
                      fullWidth
                      name="surname"
                      placeholder="surname"
                    />
                  </Grid>
                  {!!submitError && (
                    <Grid item xs={12}>
                      <Hint>
                        <Typography color="error">{submitError}</Typography>
                      </Hint>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      fullWidth
                      disabled={submitting}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'submit'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Form>
        </Grid>
      </Grid>
      <Typography variant="h5">DAI balance from web3.eth.Contract</Typography>
      <Loading meta={accountMeta}>
        {account ? (
          <>
            <Typography>{account}</Typography>
            <Loading meta={balanceMeta}>
              <Typography>{balance && balance.toString()}</Typography>
            </Loading>
          </>
        ) : (
          <Typography color="error">Ethereum account is not found</Typography>
        )}
      </Loading>
      <Typography variant="h5">DAI balance from GraphQL</Typography>
      <DaiBalance />
    </div>
  );
}
