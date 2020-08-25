import React, {Component} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import Pagination from 'react-js-pagination';
import './styles.css';

class ServerTable extends Component {
    constructor(props) {
        super(props);

        if (this.props.columns === undefined || this.props.url === undefined) {
            throw "The prop 'columns' and 'url' is required.";
        }

        let default_texts = Object.assign(ServerTable.defaultProps.options.texts, {});
        let default_icons = Object.assign(ServerTable.defaultProps.options.icons, {});
        let default_parameters_names = Object.assign(ServerTable.defaultProps.options.requestParametersNames, {});

        this.state = {
            options: Object.assign(ServerTable.defaultProps.options, this.props.options),
            requestData: {
                query: '',
                limit: 10,
                page: 1,
                orderBy: '',
                direction: 0,
            },
            data: [],
            isLoading: true,
        };
        this.state.requestData.limit = this.state.options.perPage;
        this.state.options.texts = Object.assign(default_texts, this.props.options.texts);
        this.state.options.icons = Object.assign(default_icons, this.props.options.icons);
        this.state.options.requestParametersNames = Object.assign(default_parameters_names, this.props.options.requestParametersNames);

        this.handlePerPageChange = this.handlePerPageChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.table_search_input = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.url !== this.props.url) {
            this.setState({isLoading: true}, () => {
                this.handleFetchData();
            });
        }
        return true;
    }

    componentDidMount() {
        this.handleFetchData();
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
                        className={'table-sort-icon pull-right ' + (this.state.requestData.orderBy !== column ? options.icons.sortBase : (this.state.requestData.direction === 1 ? options.icons.sortUp : options.icons.sortDown))}/>
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

        let pagination = (
            <Pagination
                itemClass='page-item'
                linkClass='page-link'
                hideDisabled
                activePage={options.currentPage}
                itemsCountPerPage={options.perPage}
                totalItemsCount={options.total}
                onChange={this.handlePageChange}
            />
        );

        return pagination;
    }

    handleSortColumnClick(column) {
        if (this.state.options.sortable.includes(column)) {
            const request_data = this.state.requestData;

            if (request_data.orderBy === column) {
                request_data.direction = request_data.direction === 1 ? 0 : 1;
            } else {
                request_data.orderBy = column;
                request_data.direction = 1;
            }

            this.setState({requestData: request_data, isLoading: true}, () => {
                this.handleFetchData();
            });
        }
    }

    refreshData() {
        this.setState({isLoading: true}, () => {
            this.handleFetchData();
        });
    }

    mapRequestData() {
        let parametersNames = this.state.options.requestParametersNames;
        let directionValues = Object.assign(this.props.options.orderDirectionValues || {}, ServerTable.defaultProps.options.orderDirectionValues);
        let requestData = this.state.requestData;

        return {
            [parametersNames.query]: requestData.query,
            [parametersNames.limit]: requestData.limit,
            [parametersNames.page]: requestData.page,
            [parametersNames.orderBy]: requestData.orderBy,
            [parametersNames.direction]: requestData.direction === 1 ? directionValues.ascending : directionValues.descending,
        };
    }

    handleFetchData() {
        const url = this.props.url;
        let options = Object.assign({}, this.state.options);
        let requestData = Object.assign({}, this.state.requestData);
        let self = this;

        const urlParams = new URLSearchParams(this.mapRequestData());
        let baseUrl = new URL(url);

        let com = baseUrl.search.length ? '&' : '?';

        if (this.props.updateUrl) {
            history.replaceState(url, null, baseUrl.search + com + urlParams.toString());
        }

        axios.get(url + com + urlParams.toString())
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

    handlePageChange(event) {
        let requestData = Object.assign({}, this.state.requestData);
        requestData.page = event;

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
                {
                    (this.props.perPage || this.props.search) &&

                    <div className="card-header text-center">
                        {
                            this.props.perPage &&
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
                        }

                        {this.state.isLoading && (this.state.options.loading)}

                        {
                            this.props.search &&
                            <div className="input-icon input-group-sm float-right">
                                <input type="text" className="form-control" style={{height: 34}}
                                       placeholder={this.state.options.texts.search} ref={this.table_search_input}
                                       onKeyUp={() => this.handleSearchClick()}/>

                                <span className="input-icon-addon"><i className="fe fe-search"></i></span>
                            </div>
                        }
                    </div>
                }
                <div className="card-body">
                    <div className="table-responsive" style={{maxHeight: this.props.options.maxHeightTable}}>
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
                                        <td colSpan={this.props.columns.length}>{this.state.options.texts.empty}</td>
                                    </tr>
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer clearfix">
                    {
                        this.props.pagination ?
                            <div className="float-left">
                                {this.state.options.texts.showing + ' ' + this.state.options.from + ' ' + this.state.options.texts.to + ' ' +
                                this.state.options.to + ' ' + this.state.options.texts.of + ' ' + this.state.options.total +
                                ' ' + this.state.options.texts.entries}
                            </div> :
                            <div className="float-left">
                                {
                                    this.state.options.total + ' ' + this.state.options.texts.entries
                                }
                            </div>
                    }
                    {
                        this.props.pagination &&
                        <ul className="pagination m-0 float-right">
                            {this.renderPagination()}
                        </ul>
                    }
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
            search: 'Search',
            empty: 'Empty Results'
        },
        requestParametersNames: {
            query: 'query',
            limit: 'limit',
            page: 'page',
            orderBy: 'orderBy',
            direction: 'direction',
        },
        orderDirectionValues: {
            ascending: 'asc',
            descending: 'desc',
        },
        total: 10,
        currentPage: 1,
        lastPage: 1,
        from: 1,
        to: 1,
        loading: (
            <div style={{fontSize: 14, display: "initial"}}><span style={{fontSize: 18}}
                                                                  className="fa fa-spinner fa-spin"/> Loading...
            </div>),
        responseAdapter: function (resp_data) {
            return {data: resp_data.data, total: resp_data.total}
        },
        maxHeightTable: 'unset'
    },
    perPage: true,
    search: true,
    pagination: true,
    updateUrl: false,
};

ServerTable.propTypes = {
    columns: PropTypes.array.isRequired,
    url: PropTypes.string.isRequired,

    hover: PropTypes.bool,
    bordered: PropTypes.bool,
    condensed: PropTypes.bool,
    striped: PropTypes.bool,
    perPage: PropTypes.bool,
    search: PropTypes.bool,
    pagination: PropTypes.bool,
    updateUrl: PropTypes.bool,

    options: PropTypes.object,
    children: PropTypes.func,
};


export default ServerTable;
