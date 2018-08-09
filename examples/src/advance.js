import React, {Component} from 'react';
import {render} from 'react-dom';
import Lodash from 'lodash';
import Table from '../../src';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedUsers: [],
            usersIDs: [],
            isAllChecked: false,
        };

        this.handleCheckboxTableChange = this.handleCheckboxTableChange.bind(this);
        this.handleCheckboxTableAllChange = this.handleCheckboxTableAllChange.bind(this);
        this.check_all = React.createRef();
    }

    handleCheckboxTableChange(event) {
        const value = event.target.value;
        let selectedUsers = this.state.selectedUsers.slice();

        selectedUsers.includes(value) ?
            selectedUsers.splice(selectedUsers.indexOf(value), 1) :
            selectedUsers.push(value);

        this.setState({selectedUsers: selectedUsers}, ()=>{
            let isAllChecked = _.difference(this.state.usersIDs, this.state.selectedUsers).length === 0;
            this.check_all.current.checked = isAllChecked;
        });

        alert('Selected users ID: ' + selectedUsers.join(', '));
    }

    handleCheckboxTableAllChange(event){
        this.setState({selectedUsers: [...new Set(this.state.selectedUsers.concat(this.state.usersIDs))]}, ()=>{
            let isAllChecked = _.difference(this.state.usersIDs, this.state.selectedUsers).length === 0;
            this.check_all.current.checked = isAllChecked;
        });
    }

    render() {
        let self = this;
        const url = 'https://react-strap-table.000webhostapp.com';
        const columns = ['id', 'name', 'email', 'avatar', 'created_at', 'actions'];
        let checkAllInput = (<input type="checkbox" ref={this.check_all}
                                    onChange={this.handleCheckboxTableAllChange}/>);
        const options = {
            perPage: 5,
            headings: {id: checkAllInput, created_at: 'Created At'},
            sortable: ['name', 'email', 'created_at'],
            columnsWidth: {name: 30, email: 30, id: 5},
            columnsAlign: {id: 'center', avatar: 'center'},
            responseAdapter: function (resp_data) {
                let usersIDs = resp_data.data.map(a => a.id);
                self.setState({usersIDs: usersIDs}, () => {
                    let isAllChecked = _.difference(self.state.usersIDs, self.state.selectedUsers).length === 0;
                    self.check_all.current.checked = isAllChecked;
                });

                return {data: resp_data.data, total: resp_data.total}
            },
            texts: {
                show: 'عرض'
            },
        };

        return (
            <Table columns={columns} url={url} options={options} bordered hover>
                {
                    function (row, column) {
                        switch (column) {
                            case 'id':
                                return (
                                    <input key={row.id} type="checkbox" value={row.id}
                                           onChange={self.handleCheckboxTableChange}
                                           checked={self.state.selectedUsers.includes(row.id)} />
                                );
                            case 'avatar':
                                return (<img src={row.avatar} className="table-image"/>);
                            case 'actions':
                                return (
                                    <div style={{textAlign: 'center'}}>
                                        <a className="btn btn-primary btn-xs table-actions-btn"
                                           href={'users/' + row.id + '/edit'}>
                                            <i className="fa fa-pencil-alt"/></a>
                                        <a className="btn btn-danger btn-xs table-actions-btn">
                                            <i className="fa fa-trash"/></a>
                                    </div>
                                );
                            default:
                                return (row[column]);
                        }
                    }
                }
            </Table>
        );
    }
}

render(<App/>, document.getElementById("root"));