import React, {Component} from 'react';
import {render} from 'react-dom';
import Lodash from 'lodash';
import Table from '../../src';

class App extends Component {

    render() {
        let self = this;
        const url = 'https://react-strap-table.000webhostapp.com';
        const columns = ['id', 'name', 'email', 'created_at'];
        const options = {
            headings: {id: '#', created_at: 'Created At'},
            sortable: ['name', 'email']
        };

        return (
            <Table columns={columns} url={url} options={options} bordered hover/>

        );
    }
}

render(<App/>, document.getElementById("root"));