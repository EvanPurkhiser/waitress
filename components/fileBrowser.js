import React from 'react';
import DocumentTitle from 'react-document-title';
import styled from '@emotion/styled';
import prettyBytes from 'pretty-bytes';

import {
  EmptyListing,
  FileIcon,
  FileName,
  FileSize,
  Header,
  Listing,
  ListingItem,
} from '.';

/**
 * Transform a path list to a URL
 */
const makeUrl = path => `/${path.map(encodeURIComponent).join('/')}`;

/**
 * Locate the path within an object.
 */
function locate(object, path, defaultValue) {
  let index = 0;
  const {length} = path;

  while (object && object.children && index < length) {
    object = object.children[path[index++]];
  }

  return index === length ? object : defaultValue;
}

const File = p => (
  <ListingItem path={p.path} onClick={p.onClick}>
    <FileIcon path={p.path} isDir={p.isDir} />
    <FileName>{p.name}</FileName>
    <FileSize>{prettyBytes(p.size)}</FileSize>
  </ListingItem>
);

export default class FileBrowser extends React.Component {
  state = {
    firstLoad: false,
    loading: false,
    tree: {},
    path: [],
    lastPath: [],
  };

  fetchOptions = {};

  componentDidMount() {
    window.addEventListener('popstate', this.updatePath);
    this.updatePath();
    this.cancelPending();
  }

  get fetchUrl() {
    return `/_tree${makeUrl(this.state.path)}`;
  }

  cancelPending() {
    if (this.fetchAborter) {
      this.fetchAborter.abort();
    }

    // The fetch aborter may only be signaled once, setup a new aborter for the
    // next request to be made.
    this.fetchAborter = new AbortController();
    this.fetchOptions.signal = this.fetchAborter.signal;
  }

  navigateToPath(path) {
    history.pushState(null, null, makeUrl(path));
    window.scrollTo(0, 0);

    this.updatePath();
  }

  navigateToItem(e, target) {
    const path = [...this.state.path, target];
    const item = locate(this.state.tree, path, {});

    if (!item.hasOwnProperty('isDir')) {
      return;
    }

    e.preventDefault();
    this.navigateToPath(path);
  }

  fetchCurrent = _ =>
    fetch(this.fetchUrl, this.fetchOptions)
      .then(r => r.json())
      .then(j => this.setState({tree: j, loading: false, firstLoad: true}))
      .catch(_ => null);

  updatePath = _ => {
    const path = decodeURIComponent(window.location.pathname)
      .split('/')
      .filter(x => x);

    this.cancelPending();
    this.setState(
      ({lastPath}) => ({path, lastPath, loading: true}),
      _ => this.fetchCurrent()
    );
  };

  navigateHome = _ => this.navigateToPath([]);

  render() {
    const {loading, tree, path, lastPath, firstLoad} = this.state;

    // If our targetItem is shallow render our lastpath until our tree has been
    // updated with the loaded path.
    const targetItem = locate(tree, path, {});
    const item = targetItem.shallow ? locate(tree, lastPath, {}) : targetItem;

    const fileMap = item.children || {};

    const files = Object.keys(fileMap).sort((a, b) => {
      const c = item.children[a];
      const d = item.children[b];

      const dirSort = d.isDir ? 1 : -1;

      return c.isDir === d.isDir ? a.localeCompare(b, {}, {numeric: true}) : dirSort;
    });

    const listItems = files.map(k => (
      <File
        {...item.children[k]}
        key={k}
        name={k}
        path={makeUrl([...path, k])}
        onClick={e => this.navigateToItem(e, k)}
      />
    ));

    const title = window.location.hostname;
    const pageTitle = path.slice(-1)[0] || title;

    return (
      <Browser>
        <Header
          title={title}
          onClick={this.navigateHome}
          isLoading={targetItem.shallow && loading}
        />
        <DocumentTitle title={pageTitle} />
        <Listing disabled={targetItem.shallow}>{listItems}</Listing>
        {firstLoad && listItems.length === 0 && <EmptyListing folder={pageTitle} />}
      </Browser>
    );
  }
}

const Browser = styled('section')`
  display: flex;
  flex-direction: column;
  max-width: 630px;
  margin: auto;
  padding: 0 15px;
`;
