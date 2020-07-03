import React, {Component} from 'react';
import {render} from 'react-dom';
import ServerTable from '../../src';

class App extends Component {

    render() {
        const url = 'https://5efe2a74dd373900160b3f24.mockapi.io/api/users';
        const columns = ['id', 'name', 'email', 'created_at'];
        const options = {
            headings: {id: '#', created_at: 'Created At'},
            sortable: ['name', 'email'],
            requestParametersNames: {query: 'search', direction: 'order'},
        };

        return (
            <ServerTable columns={columns} url={url} options={options} bordered hover refresh={false}/>
        );
    }
}

render(<App/>, document.getElementById("root"));
