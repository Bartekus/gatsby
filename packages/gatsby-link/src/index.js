/*global __PATH_PREFIX__ */
import PropTypes from "prop-types"
import React from "react"
import { Link } from "@reach/router"

import { parsePath } from "./parse-path"

export { parsePath }

export function withPrefix(path) {
  return normalizePath(`${__PATH_PREFIX__}/${path}`)
}

function normalizePath(path) {
  return path.replace(/\/+/g, `/`)
}

const NavLinkPropTypes = {
  activeClassName: PropTypes.string,
  activeStyle: PropTypes.object,
}

// Set up IntersectionObserver
const handleIntersection = (el, cb) => {
  const io = new window.IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (el === entry.target) {
        // Check if element is within viewport, remove listener, destroy observer, and run link callback.
        // MSEdge doesn't currently support isIntersecting, so also test for  an intersectionRatio > 0
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          io.unobserve(el)
          io.disconnect()
          cb()
        }
      }
    })
  })
  // Add element to the observer
  io.observe(el)
}

class GatsbyLink extends React.Component {
  constructor(props) {
    super(props)
    // Default to no support for IntersectionObserver
    let IOSupported = false
    if (typeof window !== `undefined` && window.IntersectionObserver) {
      IOSupported = true
    }

    this.state = {
      IOSupported,
    }
    this.handleRef = this.handleRef.bind(this)
  }

  componentDidUpdate(prevProps, prevState) {
    // Preserve non IO functionality if no support
    if (this.props.to !== prevProps.to && !this.state.IOSupported) {
      ___loader.enqueue(parsePath(this.props.to).pathname)
    }
  }

  componentDidMount() {
    // Preserve non IO functionality if no support
    if (!this.state.IOSupported) {
      ___loader.enqueue(parsePath(this.props.to).pathname)
    }
  }

  handleRef(ref) {
    if (this.props.innerRef) {
      this.props.innerRef(ref)
    }

    if (this.state.IOSupported && ref) {
      // If IO supported and element reference found, setup Observer functionality
      handleIntersection(ref, () => {
        ___loader.enqueue(parsePath(this.props.to).pathname)
      })
    }
  }

  defaultGetProps = ({ isCurrent }) => {
    if (isCurrent) {
      return {
        className: [this.props.className, this.props.activeClassName]
          .filter(Boolean)
          .join(` `),
        style: { ...this.props.style, ...this.props.activeStyle },
      }
    }
    return null
  }

  render() {
    const {
      to,
      getProps = this.defaultGetProps,
      onClick,
      onMouseEnter,
      /* eslint-disable no-unused-vars */
      activeClassName: $activeClassName,
      activeStyle: $activeStyle,
      innerRef: $innerRef,
      state,
      replace,
      /* eslint-enable no-unused-vars */
      ...rest
    } = this.props

    if (process.env.NODE_ENV !== `production`) {
      const LOCAL_URL = /^\/(?!\/)/
      const message = `External link ${to} was detected in a Link component. Use the Link component only for internal links. See: https://gatsby.app/internal-links`

      try {
        const link = new URL(to, window.location)

        if (window.location.host !== link.host) {
          console.warn(message)
        }
      } catch (e) {
        // in case IE happens, we revert back to the old way
        if (!LOCAL_URL.test(to)) {
          console.warn(message)
        }
      }
    }

    const prefixedTo = withPrefix(to)

    return (
      <Link
        to={prefixedTo}
        state={state}
        getProps={getProps}
        innerRef={this.handleRef}
        onMouseEnter={e => {
          if (onMouseEnter) {
            onMouseEnter(e)
          }
          ___loader.hovering(parsePath(to).pathname)
        }}
        onClick={e => {
          if (onClick) {
            onClick(e)
          }

          if (
            e.button === 0 && // ignore right clicks
            !this.props.target && // let browser handle "target=_blank"
            !e.defaultPrevented && // onClick prevented default
            !e.metaKey && // ignore clicks with modifier keys...
            !e.altKey &&
            !e.ctrlKey &&
            !e.shiftKey
          ) {
            e.preventDefault()

            // Make sure the necessary scripts and data are
            // loaded before continuing.
            navigate(to, { state, replace })
          }

          return true
        }}
        {...rest}
      />
    )
  }
}

GatsbyLink.propTypes = {
  ...NavLinkPropTypes,
  innerRef: PropTypes.func,
  onClick: PropTypes.func,
  to: PropTypes.string.isRequired,
  replace: PropTypes.bool,
}

export default React.forwardRef((props, ref) => (
  <GatsbyLink innerRef={ref} {...props} />
))

export const navigate = (to, options) => {
  window.___navigate(withPrefix(to), options)
}

export const push = to => {
  console.warn(
    `The "push" method is now deprecated and will be removed in Gatsby v3. Please use "navigate" instead.`
  )
  window.___push(withPrefix(to))
}

export const replace = to => {
  console.warn(
    `The "replace" method is now deprecated and will be removed in Gatsby v3. Please use "navigate" instead.`
  )
  window.___replace(withPrefix(to))
}

// TODO: Remove navigateTo for Gatsby v3
export const navigateTo = to => {
  console.warn(
    `The "navigateTo" method is now deprecated and will be removed in Gatsby v3. Please use "navigate" instead.`
  )
  return push(to)
}
