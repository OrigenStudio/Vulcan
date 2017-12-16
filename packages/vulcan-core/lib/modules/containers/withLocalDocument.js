import compose from 'recompose/compose';
import withProps from 'recompose/withProps';
import { withApollo } from 'react-apollo';
import { getFragment } from 'meteor/vulcan:core';

/**
 * Constructs a base object so {@link dataIdFromObject} can create an id.
 *
 * @param {{collection, documentId}}
 * @return {{_id: String, __typename: String}}
 */
export const defaultDataIdFromObjectArgs = ({ collection, documentId }) => ({
  _id: documentId,
  __typename: collection.typeName,
});

/**
 * Return HOC that retrieves a document from the Apollo local cache.
 *
 * The document is retrieved by using the Apollo method `readFragment`. The fragment to use can
 * be specified from the options passed to the HOC or by the props received by the component.
 * More info about this in `fragmentFromProps` option.
 *
 * ### Options
 *
 *  - `collection`: collection of the document to be retrieved
 *  - `overwriteDocument` (optional): perform the local query even when the document is already
 *    received as prop and overwrites it. Defaults to `false`
 *  - `dataIdFromObjectArgs` (optional): prepares the object to be passed to `dataIfFromObject`.
 *    Collection and props are passed to this function as a single argument. Defaults to
 *    {@link defaultDataIdFromObjectArgs}
 *  - `fragmentFromProps` (optional): determines whether the fragment must be loaded from props or
 *    from this options. Defaults to `false`
 *  - `fragmentName` (optional): name of fragment to use in case `fragmentFromProps = false`.
 *    Mandatory if multiple fragments are used
 *  - `fragment` (optional): fragment to use in case `fragmentFromProps = false`. Defaults to
 *    `getFragment(fragmentName)`
 *
 * ### Props
 *
 *  - `client`: apollo client
 *  - `fragmentName` (optional): name of fragment to use in case `fragmentFromProps = true`.
 *    Mandatory if multiple fragments are used
 *  - `fragment` (optional): fragment to use in case `fragmentFromProps = true`. Defaults to
 *    `getFragment(fragmentName)`
 *
 * @param {object} options
 * @return {React.Component}
 */
export default function withLocalDocument(options) {
  const {
    collection,
    overwriteDocument = false,
    dataIdFromObjectArgs = defaultDataIdFromObjectArgs,
    fragmentFromProps = false,
  } = options;

  return compose(
    withApollo,
    withProps(
      props => {
        if (props.document && !overwriteDocument) {
          return {};
        }

        const {
          client,
        } = props;
        const {
          fragmentName,
          fragment = getFragment(fragmentName),
        } = fragmentFromProps ? props : options;

        try {
          const document = client.readFragment({
            fragment,
            fragmentName,
            id: client.dataIdFromObject(dataIdFromObjectArgs({ collection, ...props })),
          });
          if (document) {
            return {
              document,
              loading: false,
              fromCache: true,
            }
          }
        } catch (error) {
          console.error(error);
        }
        return {};
      }
    ),
  );
};
