import React, {Component} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './styles.css';

class ServerTable extends Component {
    constructor(props) {
        super(props);

        if (this.props.columns === undefined || this.props.url === undefined) {
            throw "The prop 'columns' and 'url' is required.";
        }
        let default_texts = Object.assign(ServerTable.defaultProps.options.texts, {});
        let default_icons = Object.assign(ServerTable.defaultProps.options.texts, {});

        this.state = {
            options: Object.assign(ServerTable.defaultProps.options, this.props.options),
            requestData: {
                query: '',
                limit: 10,
                page: 1,
                orderBy: '',
                ascending: true,
            },
            data: [],
            isLoading: true,
        };
        this.state.requestData.limit = this.state.options.perPage;
        this.state.options.texts = Object.assign(default_texts, this.props.options.texts);
        this.state.options.icons = Object.assign(default_icons, this.props.options.icons);

        this.handleFetchData();

        this.handlePerPageChange = this.handlePerPageChange.bind(this);
        this.table_search_input = React.createRef();
    }

    tableClass() {
        let classes = 'table ';
        this.props.hover ? classes += 'table-hover ' : '';
        this.props.bordered ? classes += 'table-bordered ' : '';
        this.props.condensed ? classes += 'table-condensed ' : '';
        this.props.striped ? classes += 'table-striped ' : '';

        return classes;
    }

    renderColumns() {
        const columns = this.props.columns.slice();
        const headings = this.state.options.headings;
        const options = this.state.options;
        const columns_width = this.state.options.columnsWidth;

        return columns.map((column) => (
            <th key={column}
                className={'table-' + column + '-th ' + (options.sortable.includes(column) ? ' table-sort-th ' : '') +
                (options.columnsAlign.hasOwnProperty(column) ? ' text-' + options.columnsAlign[column] : '')}
                style={{
                    maxWidth: columns_width.hasOwnProperty(column) ?
                        Number.isInteger(columns_width[column]) ?
                            columns_width[column] + '%' :
                            columns_width[column] : ''
                }}
                onClick={() => this.handleSortColumnClick(column)}>
                <span>{headings.hasOwnProperty(column) ? headings[column] : column.replace(/^\w/, c => c.toUpperCase())}</span>
                {
                    options.sortable.includes(column) && <span
                        className={'table-sort-icon pull-right ' + (this.state.requestData.orderBy !== column ? options.icons.sortBase : (this.state.requestData.ascending === 1 ? options.icons.sortUp : options.icons.sortDown))}/>
                }
            </th>
        ));
    }

    renderData() {
        const data = this.state.data.slice();
        const columns = this.props.columns.slice();
        const has_children = this.props.children !== undefined;
        let self = this;

        return data.map(function (row, row_index) {
            row.index = row_index;
            return (
                <tr key={row_index}>
                    {
                        columns.map((column, index) => (
                            <td key={column + index} className={'table-' + column + '-td'}>
                                {has_children ?
                                    self.props.children(row, column) :
                                    row[column]}
                            </td>
                        ))
                    }
                </tr>
            )
        });
    }

    renderPagination() {
        const options = this.state.options;

        let pagination = [];

        pagination.push(
            <li key="first"
                className={'page-item ' + (options.currentPage === 1 || options.currentPage === 0 ? 'disabled' : '')}>
                <a className="page-link" href="#" onClick={() => this.handlePageChange(1)}>&laquo;</a>
            </li>
        );
        for (let i = 1; i <= options.lastPage; i++) {
            pagination.push(
                <li key={i} className={'page-item ' + (options.currentPage === i ? 'active' : '')}>
                    <a className="page-link" href="#" onClick={() => this.handlePageChange(i)}>{i}</a>
                </li>
            );
        }
        pagination.push(
            <li key="last" className={'page-item ' + (options.currentPage === options.lastPage ? 'disabled' : '')}>
                <a className="page-link" href="#" onClick={() => this.handlePageChange(options.lastPage)}>&raquo;</a>
            </li>
        );

        return pagination;
    }

    handleSortColumnClick(column) {
        if (this.state.options.sortable.includes(column)) {
            const request_data = this.state.requestData;

            if (request_data.orderBy === column) {
                request_data.ascending = request_data.ascending === 1 ? 0 : 1;
            } else {
                request_data.orderBy = column;
                request_data.ascending = 1;
            }

            this.setState({requestData: request_data, isLoading: true}, () => {
                this.handleFetchData();
            });
        }
    }

    handleFetchData() {
        const url = this.props.url;
        let options = Object.assign({}, this.state.options);
        let requestData = Object.assign({}, this.state.requestData);
        let self = this;

        axios.get(url, {params: requestData})
            .then(function (response) {
                let response_data = response.data;

                let out_adapter = self.state.options.responseAdapter(response_data);
                if (out_adapter === undefined || !out_adapter ||
                    typeof out_adapter !== 'object' || out_adapter.constructor !== Object ||
                    !out_adapter.hasOwnProperty('data') || !out_adapter.hasOwnProperty('total')) {
                    throw "You must return 'object' contains 'data' and 'total' attributes"
                } else if (out_adapter.data === undefined || out_adapter.total === undefined) {
                    throw "Please check from returned data or your 'responseAdapter'. \n response must have 'data' and 'total' attributes.";
                }

                options.total = out_adapter.total;
                if (out_adapter.total === 0) {
                    options.currentPage = 0;
                    options.lastPage = 0;
                    options.from = 0;
                    options.to = 0;
                } else {
                    options.currentPage = requestData.page;
                    options.lastPage = Math.ceil(out_adapter.total / requestData.limit);
                    options.from = requestData.limit * (requestData.page - 1) + 1;
                    options.to = options.lastPage === options.currentPage ? options.total : requestData.limit * (requestData.page);
                }

                self.setState({data: out_adapter.data, options: options, isLoading: false});
            });
    }

    handlePerPageChange(event) {
        const {name, value} = event.target;
        let options = Object.assign({}, this.state.options);
        let requestData = Object.assign({}, this.state.requestData);

        options.perPage = value;
        requestData.limit = event.target.value;
        requestData.page = 1;

        this.setState({requestData: requestData, options: options, isLoading: true}, () => {
            this.handleFetchData();
        });
    }

    handlePageChange(page) {
        let requestData = Object.assign({}, this.state.requestData);
        requestData.page = page;

        this.setState({requestData: requestData, isLoading: true}, () => {
            this.handleFetchData();
        });
    }

    handleSearchClick() {
        let query = this.table_search_input.current.value;
        let requestData = Object.assign({}, this.state.requestData);
        requestData.query = query;
        requestData.page = 1;

        this.setState({requestData: requestData, isLoading: true}, () => {
            this.handleFetchData();
        });
    }

    render() {
        return (
            <div className="card react-strap-table">
                <div className="card-header text-center">
                    <div className="float-left">
                        <span>{this.state.options.texts.show} </span>
                        <label>
                            <select className="form-control form-control-sm"
                                    onChange={this.handlePerPageChange}>
                                {this.state.options.perPageValues.map(value => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <span> {this.state.options.texts.entries}</span>
                    </div>

                    {this.state.isLoading && (this.state.options.loading)}

                    <div className="input-group input-group-sm float-right" style={{width: 150}}>
                        <input type="text" className="form-control"
                               placeholder={this.state.options.texts.search} ref={this.table_search_input}
                               onKeyUp={() => this.handleSearchClick()}/>

                        <div className="input-group-append">
                            <button type="submit" className="btn btn-default"
                                    onClick={() => this.handleSearchClick()}>
                                <i className={this.state.options.icons.search}/>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className={this.tableClass()}>
                            <thead>
                            <tr>
                                {this.renderColumns()}
                            </tr>
                            </thead>
                            <tbody>
                            {
                                this.state.options.total > 0 ?
                                    this.renderData() :
                                    <tr className="text-center">
                                        <td colSpan={this.props.columns.length}>No Results.</td>
                                    </tr>
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer clearfix">
                    <div className="float-left">
                        {'Showing ' + this.state.options.from + ' ' + this.state.options.texts.to + ' ' +
                        this.state.options.to + ' ' + this.state.options.texts.of + ' ' + this.state.options.total +
                        ' ' + this.state.options.texts.entries}
                    </div>
                    <ul className="pagination m-0 float-right">
                        {this.renderPagination()}
                    </ul>
                </div>
            </div>
        );
    }
}

ServerTable.defaultProps = {
    options: {
        headings: {},
        sortable: [],
        columnsWidth: {},
        columnsAlign: {},
        initialPage: 1,
        perPage: 10,
        perPageValues: [10, 20, 25, 100],
        icons: {
            sortBase: 'fa fa-sort',
            sortUp: 'fa fa-sort-amount-up',
            sortDown: 'fa fa-sort-amount-down',
            search: 'fa fa-search'
        },
        texts: {
            show: 'Show',
            entries: 'entries',
            showing: 'Showing',
            to: 'to',
            of: 'of',
            search: 'Search'
        },
        total: 10,
        currentPage: 1,
        lastPage: 1,
        from: 1,
        to: 1,
        loading: (
            <div style={{fontSize: 18, display: "initial"}}><span className="fa fa-spinner fa-spin"/> Loading...</div>),
        responseAdapter: function (resp_data) {
            return {data: resp_data.data, total: resp_data.total}
        }
    },
};

ServerTable.propTypes = {
    columns: PropTypes.array.isRequired,
    url: PropTypes.string.isRequired,

    hover: PropTypes.bool,
    bordered: PropTypes.bool,
    condensed: PropTypes.bool,
    striped: PropTypes.bool,

    options: PropTypes.object,
    children: PropTypes.func,
};


export default ServerTable;