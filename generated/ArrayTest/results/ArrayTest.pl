use strict;
use warnings;

package ArrayTestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub arrayTest {
    my ( $self ) = @_;
    my $constant_arr = [5];
    return scalar(@{$constant_arr});
}