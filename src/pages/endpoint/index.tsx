import React from 'react';
import { useFormik } from 'formik';
import { getSocketURL } from '@/components/shared';
import { reloadPage } from '@/utils/navigation-utils';
import { Button, Input, Text } from '@deriv-com/ui';
import { LocalStorageConstants } from '@deriv-com/utils';
import './endpoint.scss';
const Endpoint = () => {
    const formik = useFormik({
        initialValues: {
            serverUrl: localStorage.getItem(LocalStorageConstants.configServerURL) ?? getSocketURL(),
        },
        onSubmit: values => {
            localStorage.setItem(LocalStorageConstants.configServerURL, values.serverUrl);
            formik.resetForm({ values });
        },
        validate: values => {
            const errors: { [key: string]: string } = {};
            if (!values.serverUrl) {
                errors.serverUrl = 'This field is required';
            }
            return errors;
        },
    });

    return (
        <div className='endpoint'>
            <Text weight='bold' className='endpoint__title'>
                Change API endpoint
            </Text>
            <form onSubmit={formik.handleSubmit} className='endpoint__form'>
                <Input
                    data-testid='dt_endpoint_server_url_input'
                    label='Server'
                    name='serverUrl'
                    message={formik.errors.serverUrl as string}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.serverUrl}
                />
                <div>
                    <Button className='endpoint__button' disabled={!formik.dirty || !formik.isValid} type='submit'>
                        Submit
                    </Button>
                    <Button
                        className='endpoint__button'
                        color='black'
                        onClick={() => {
                            localStorage.removeItem(LocalStorageConstants.configServerURL);
                            // Get the default server URL based on current environment
                            const server_url = getSocketURL();

                            formik.resetForm({
                                values: {
                                    serverUrl: server_url,
                                },
                            });
                            reloadPage();
                        }}
                        variant='outlined'
                        type='button'
                    >
                        Reset to original settings
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Endpoint;
