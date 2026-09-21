export const linkagesSampleData = {
    "status": "success",
    "data": {
        "success": true,
        "userid": "13069867",
        "currentDegree": 0,
        "nextDegree": 1,
        "nodeCount": 11,
        "edgeCount": 12,
        "nodes": [
            {
                "id": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "label": "CUSTOMER",
                "properties": {
                    "onboarded_at": "2026-02-24T20:09:53.496Z",
                    "userid": "13069867",
                    "loans_count": 1,
                    "customer_name": "9Teen Fashion",
                    "cibil_score": 767,
                    "current_dpd": 0,
                    "risk_indicator": "Low Risk",
                    "total_loan_amount": 38000
                },
                "degree": 0,
                "hasBranches": true,
                "branchCount": 10
            },
            {
                "id": "92ce5ac9-677c-3074-ebd0-de37f4b2e8b3",
                "label": "PHONE",
                "properties": {
                    "source": "[{\"type\":\"cibil\"},{\"type\":\"ref_contact\"}]",
                    "country": "IN",
                    "telephone_type": "1",
                    "phone_number": "9157459171",
                    "relation_type": "spouse",
                    "relation_name": "Sofiya shaikh",
                    "data": "[{\"source\":\"cibil\",\"phone_number\":\"9157459171\",\"telephone_type\":\"1\"},{\"source\":\"ref_contact\",\"phone_number\":\"9157459171\",\"name\":\"Sofiya shaikh\",\"relation\":\"spouse\",\"refId\":\"ref_706415\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 1
            },
            {
                "id": "d8ce4dbf-9fc5-4924-4877-5ac8e92f1463",
                "label": "EMAIL",
                "properties": {
                    "source": "[{\"type\":\"bank_statement\"}]",
                    "domain": "gmail.com",
                    "email": "nomail@gmail.com",
                    "data": "[{\"source\":\"bank_statement\",\"email\":\"nomail@gmail.com\",\"domain\":\"gmail.com\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 3631
            },
            {
                "id": "d4ce4dbf-fee0-2374-552c-12f3d05058fa",
                "label": "EMAIL",
                "properties": {
                    "source": "[{\"type\":\"bank_statement\"}]",
                    "domain": "nomail.com",
                    "email": "nomail@nomail.com",
                    "data": "[{\"source\":\"bank_statement\",\"email\":\"nomail@nomail.com\",\"domain\":\"nomail.com\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 6609
            },
            {
                "id": "aace5ac9-6820-27de-48fd-45b869b1a186",
                "label": "LOCATION",
                "properties": {
                    "source": "[{\"type\":\"current\"},{\"type\":\"permanent\"},{\"type\":\"cibil\"}]",
                    "country": "India",
                    "address_full": "Akbarbhai, 1531-48, Sheri Garib Aavas Yojna, Javaharlal Nheru Slam Qurters, Vatva, Vatva Daskroi, Ahmedabad, Vatva, Gujarat, India,",
                    "pincode": "382445",
                    "city": "Ahmedabad",
                    "state": "Gujarat",
                    "lon": 72.624087,
                    "lat": 22.965827,
                    "normalized_text": "akbarbhai 1531 48 sheri garib aavas yojna javaharlal nheru slam qurters vatva vatva daskroi ahmedabad vatva gujarat india",
                    "fingerprint": "382445::1531-48::aavas|akbarbhai|daskroi|garib|javaharlal|nheru|qurters|sheri|slam|vatva|vatva|yojna",
                    "h3r12": "8c42cea462031ff",
                    "h3r13": "8d42cea462030ff",
                    "block_key": "PIN_NUM:382445:1531",
                    "data": "[{\"source\":\"current\",\"address_full\":\"Akbarbhai, 1531-48, Sheri Garib Aavas Yojna, Javaharlal Nheru Slam Qurters, Vatva, Vatva Daskroi, Ahmedabad, Vatva, Gujarat, India,\",\"pincode\":\"382440\",\"city\":\"Ahmedabad\",\"state\":\"GUJARAT\"},{\"source\":\"permanent\",\"address_full\":\"Akbarbhai, 1531-48, Sheri Garib Aavas Yojna, Javaharlal Nheru Slam Qurters, Vatva, Vatva Daskroi, Ahmedabad, Vatva, Gujarat, India,\",\"pincode\":\"382440\",\"city\":\"Ahmedabad\",\"state\":\"GUJARAT\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 1
            },
            {
                "id": "52ce4dc0-5480-3e20-dd18-cf0ca1cbc540",
                "label": "PHONE",
                "properties": {
                    "source": "[{\"type\":\"bank_transaction_merchant_upi\"}]",
                    "country": "IN",
                    "phone_number": "2810050501",
                    "data": "[{\"source\":\"bank_transaction_merchant_upi\",\"phone_number\":\"2810050501\",\"upi_id\":\"paytmqr281005050101rrh2tg0q2rds@paytm\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 3002
            },
            {
                "id": "8ece5ac9-677f-3056-023b-385bccb092e7",
                "label": "PHONE",
                "properties": {
                    "source": "[{\"type\":\"ref_contact\"},{\"type\":\"bank_transaction_p2p_upi\"}]",
                    "country": "IN",
                    "phone_number": "9104638483",
                    "relation_type": "friend1",
                    "relation_name": "Rajja bhai",
                    "data": "[{\"source\":\"ref_contact\",\"phone_number\":\"9104638483\",\"name\":\"Rajja bhai\",\"relation\":\"friend1\",\"refId\":\"ref_602692\"},{\"source\":\"bank_transaction_p2p_upi\",\"phone_number\":\"9104638483\",\"upi_id\":\"9104638483@axl\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 1
            },
            {
                "id": "ccce5ac9-67b8-ad3a-cc97-9728bc393212",
                "label": "PHONE",
                "properties": {
                    "source": "[{\"type\":\"bank_transaction_p2p_upi\"}]",
                    "country": "IN",
                    "phone_number": "8308229537",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"phone_number\":\"8308229537\",\"upi_id\":\"8308229537633sn0724@mairtel\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 2
            },
            {
                "id": "eece4dc3-b5d0-c60b-898f-62cd47231559",
                "label": "UPI_ID",
                "properties": {
                    "source": "[{\"type\":\"bank_transaction_merchant_upi\"}]",
                    "upi_id": "cashfree.mpokketfinancialservices1@kotak",
                    "data": "[{\"source\":\"bank_transaction_merchant_upi\",\"upi_id\":\"cashfree.mpokketfinancialservices1@kotak\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 84
            },
            {
                "id": "72ce4e19-8e2f-57c3-479e-2907325d8a87",
                "label": "UPI_ID",
                "properties": {
                    "source": "[{\"type\":\"bank_transaction_p2p_upi\"}]",
                    "upi_id": "bajajautoconsumer@yesbank",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"upi_id\":\"bajajautoconsumer@yesbank\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 22
            },
            {
                "id": "a4ce4dd4-bdc3-d7b3-b947-2a933a5f737e",
                "label": "UPI_ID",
                "properties": {
                    "source": "[{\"type\":\"bank_transaction_p2p_upi\"}]",
                    "upi_id": "kbratn@axl",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"upi_id\":\"kbratn@axl\"}]"
                },
                "degree": 1,
                "hasBranches": true,
                "branchCount": 35
            }
        ],
        "edges": [
            {
                "id": "e4ce5ac9-6912-959c-4dd7-12b4f1e71225",
                "label": "HAS_PHONE",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "92ce5ac9-677c-3074-ebd0-de37f4b2e8b3",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.091Z",
                    "edgeId": "327214af-a77b-47f7-90e0-f1a9ef2e603b",
                    "data": "[{\"source\":\"cibil\",\"phone_number\":\"9157459171\",\"telephone_type\":\"1\"},{\"source\":\"ref_contact\",\"phone_number\":\"9157459171\",\"name\":\"Sofiya shaikh\",\"relation\":\"spouse\",\"refId\":\"ref_706415\"}]"
                }
            },
            {
                "id": "22ce5ac9-6916-f143-de9d-3c49205fd08c",
                "label": "HAS_EMAIL",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "d8ce4dbf-9fc5-4924-4877-5ac8e92f1463",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.091Z",
                    "edgeId": "9c1c9406-4105-4480-809b-9e0daf9ada98",
                    "data": "[{\"source\":\"cibil\",\"email\":\"nomail@gmail.com\",\"domain\":\"gmail.com\"}]"
                }
            },
            {
                "id": "a2ce5ac9-6916-4e33-24c7-a26b7ed004e3",
                "label": "HAS_EMAIL",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "d4ce4dbf-fee0-2374-552c-12f3d05058fa",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.091Z",
                    "edgeId": "36dc1c09-70ea-4372-b7bc-6a554af0c63e",
                    "data": "[{\"source\":\"cibil\",\"email\":\"nomail@nomail.com\",\"domain\":\"nomail.com\"}]"
                }
            },
            {
                "id": "d0ce5ac9-6916-7dc3-7dfc-04cae18d269d",
                "label": "HAS_ADDRESS",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "aace5ac9-6820-27de-48fd-45b869b1a186",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.091Z",
                    "edgeId": "d1a83492-77cd-4fde-a74c-b0678f32c901",
                    "address_type": "current",
                    "data": "[{\"source\":\"current\",\"address_full\":\"Akbarbhai, 1531-48, Sheri Garib Aavas Yojna, Javaharlal Nheru Slam Qurters, Vatva, Vatva Daskroi, Ahmedabad, Vatva, Gujarat, India,\",\"pincode\":\"382440\",\"city\":\"Ahmedabad\",\"state\":\"GUJARAT\"},{\"source\":\"permanent\",\"address_full\":\"Akbarbhai, 1531-48, Sheri Garib Aavas Yojna, Javaharlal Nheru Slam Qurters, Vatva, Vatva Daskroi, Ahmedabad, Vatva, Gujarat, India,\",\"pincode\":\"382440\",\"city\":\"Ahmedabad\",\"state\":\"GUJARAT\"}]"
                }
            },
            {
                "id": "6ace5ac9-692a-6c19-1a7e-e1aa4b228446",
                "label": "PAID_TO_PHONE",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "52ce4dc0-5480-3e20-dd18-cf0ca1cbc540",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.145Z",
                    "edgeId": "44f3160a-dc21-4511-893b-bcb98c4a4744",
                    "data": "[{\"source\":\"bank_transaction_merchant_upi\",\"phone_number\":\"2810050501\",\"upi_id\":\"paytmqr2810050501018770cukfazk9@paytm\"}]"
                }
            },
            {
                "id": "10ce5ac9-693e-02fe-19b6-d128288ff0a0",
                "label": "PAID_TO_PHONE",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "8ece5ac9-677f-3056-023b-385bccb092e7",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.178Z",
                    "edgeId": "0cf2eccf-e61c-4325-a51a-ca82ffc7b495",
                    "data": "[{\"source\":\"ref_contact\",\"phone_number\":\"9104638483\",\"name\":\"Rajja bhai\",\"relation\":\"friend1\",\"refId\":\"ref_602692\"},{\"source\":\"bank_transaction_p2p_upi\",\"phone_number\":\"9104638483\",\"upi_id\":\"9104638483@axl\"}]"
                }
            },
            {
                "id": "82ce5ac9-693a-5026-4838-4e5b7acac9a0",
                "label": "PAID_TO_PHONE",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "ccce5ac9-67b8-ad3a-cc97-9728bc393212",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.176Z",
                    "edgeId": "d0e1ceff-adb0-411b-902e-e896faa7de27",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"phone_number\":\"8308229537\",\"upi_id\":\"8308229537633sn0724@mairtel\"}]"
                }
            },
            {
                "id": "d8ce5ac9-6990-8c64-23d4-17b018a37e8a",
                "label": "PAID_TO",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "eece4dc3-b5d0-c60b-898f-62cd47231559",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.345Z",
                    "edgeId": "181f1f21-4c59-4642-ab70-b7b12b041556",
                    "data": "[{\"source\":\"bank_transaction_merchant_upi\",\"upi_id\":\"cashfree.mpokketfinancialservices1@kotak\"}]"
                }
            },
            {
                "id": "e4ce5ac9-69a8-91d4-f9ed-731633b62d86",
                "label": "PAID_TO",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "72ce4e19-8e2f-57c3-479e-2907325d8a87",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.380Z",
                    "edgeId": "84d164d3-33b9-481a-af8d-c789881984ab",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"upi_id\":\"bajajautoconsumer@yesbank\"}]"
                }
            },
            {
                "id": "48ce5ac9-69a5-2587-f95f-5d05c52348d1",
                "label": "PAID_TO",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "a4ce4dd4-bdc3-d7b3-b947-2a933a5f737e",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.380Z",
                    "edgeId": "2142b779-5cbe-46f6-9612-5743a1f887d7",
                    "data": "[{\"source\":\"bank_transaction_p2p_upi\",\"upi_id\":\"kbratn@axl\"}]"
                }
            },
            {
                "id": "dcce5ac9-6939-133b-3085-8d001755c6e3",
                "label": "REFERRED_TO",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "8ece5ac9-677f-3056-023b-385bccb092e7",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.170Z",
                    "edgeId": "b876ff54-9b6d-4e2f-88a4-dbc9191546c8",
                    "relationship_type": "friend1",
                    "relation_type": "friend1",
                    "relation_name": "Rajja bhai",
                    "data": "[{\"source\":\"ref_contact\",\"phone_number\":\"9104638483\",\"name\":\"Rajja bhai\",\"relation\":\"friend1\",\"refId\":\"ref_602692\"}]"
                }
            },
            {
                "id": "34ce5ac9-6924-ce13-81a5-53f80be5c76b",
                "label": "REFERRED_TO",
                "from": "64ce5ac9-6741-f003-110d-bedba40529ba",
                "to": "92ce5ac9-677c-3074-ebd0-de37f4b2e8b3",
                "properties": {
                    "createdAt": "2026-03-03T21:20:24.093Z",
                    "edgeId": "feaeab38-f277-4c97-9b92-4d89ea6f35bc",
                    "relationship_type": "spouse",
                    "relation_type": "spouse",
                    "relation_name": "Sofiya shaikh",
                    "data": "[{\"source\":\"ref_contact\",\"phone_number\":\"9157459171\",\"name\":\"Sofiya shaikh\",\"relation\":\"spouse\",\"refId\":\"ref_706415\"}]"
                }
            }
        ]
    }
}
