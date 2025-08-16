# openapi_client.KmsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**client_get**](KmsApi.md#client_get) | **GET** /client | 
[**model_get**](KmsApi.md#model_get) | **GET** /model | 


# **client_get**
> bytearray client_get()

Get FHE Client.

### Example


```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.KmsApi(api_client)

    try:
        api_response = api_instance.client_get()
        print("The response of KmsApi->client_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling KmsApi->client_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**bytearray**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/zip, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | ZIP file containing the client. |  -  |
**400** | Bad Request |  -  |
**0** | Default error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **model_get**
> bytearray model_get()

Get FHE model.

### Example


```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.KmsApi(api_client)

    try:
        api_response = api_instance.model_get()
        print("The response of KmsApi->model_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling KmsApi->model_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**bytearray**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/zip, application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | ZIP file containing the server. |  -  |
**400** | Bad Request |  -  |
**0** | Default error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

