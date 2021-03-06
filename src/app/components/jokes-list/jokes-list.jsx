import React, { useEffect, useState } from 'react'
import { Box } from '@material-ui/core'
import { connect } from 'react-redux'

import { SearchBar, JokeCard } from 'app/components'
import { selectAllJokes, subscribeJokesChannel, unsubscribeJokesChannel } from 'lib/jokes'
import { filterString } from 'lib/utils'
import { useStyles } from './styles'

import NoDataImage from '../../../assets/no-data.svg'

export const JokesListComponent = ({
  jokes,
  subscribeJokesChannel,
  unsubscribeJokesChannel,
}) => {
  const [filter, setFilter] = useState('')
  const classes = useStyles()

  useEffect(() => {
    subscribeJokesChannel()
    return unsubscribeJokesChannel
  }, [subscribeJokesChannel])

  const clearFilter = () => setFilter('')
  const onSearchTextChange = e => {
    setFilter(e.target.value)
  }

  const filteredJokes = jokes.filter(joke => filterString(joke.name, filter))

  const renderEmptyList = (
    <div className={classes.emptyWrapper}>
      <img src={NoDataImage} alt='No Data' className={classes.emptyImage} />
    </div>
  )

  return (
    <>
      <SearchBar value={filter} onChange={onSearchTextChange} onClear={clearFilter} />
      {filteredJokes.length !== 0 ? (
        <Box boxShadow={3} mb={4}>
          {filteredJokes.map(joke => (
            <JokeCard joke={joke} key={joke.id} />
          ))}
        </Box>
      ) : (
        renderEmptyList
      )}
    </>
  )
}

const mapStateToProps = state => ({
  jokes: selectAllJokes(state),
})

const dispatchToProps = dispatch => ({
  subscribeJokesChannel: () => dispatch(subscribeJokesChannel()),
  unsubscribeJokesChannel: () => dispatch(unsubscribeJokesChannel()),
})

export const JokesList = connect(mapStateToProps, dispatchToProps)(JokesListComponent)
